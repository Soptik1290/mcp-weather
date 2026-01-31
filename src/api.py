"""
HTTP API Server for Weather MCP.
Wraps MCP tools as REST endpoints for frontend access.
"""

# Load .env file FIRST before any other imports
from dotenv import load_dotenv
load_dotenv()

import os
import os
from fastapi import FastAPI, HTTPException, Response, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import json
import httpx


# HTTP client for reverse geocoding is now in src.services

from src.services import initialize_providers, reverse_geocode, get_open_meteo_provider
from src.aggregator import WeatherAggregator
from src.models import Location, WeatherData

# Initialize app
app = FastAPI(
    title="Weather MCP API",
    description="AI-powered weather aggregation API",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    return response

# Initialize providers
providers = initialize_providers()
open_meteo = get_open_meteo_provider(providers)

print(f"Active providers: {[p[0] for p in providers]}")

# Redis Cache
import redis.asyncio as redis
import json
from datetime import timedelta

REDIS_URL = os.getenv("REDIS_URL")
redis_client = None

if REDIS_URL:
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        print(f"✓ Redis cache enabled: {REDIS_URL}")
    except Exception as e:
        print(f"✗ Redis connection failed: {e}")

async def get_cached_weather(key: str):
    if not redis_client: return None
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

async def set_cached_weather(key: str, data: dict, ttl_seconds: int = 1800):
    if not redis_client: return
    try:
        await redis_client.setex(key, timedelta(seconds=ttl_seconds), json.dumps(data))
    except Exception as e:
        print(f"Redis set error: {e}")

class RateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute

    async def __call__(self, request: Request):
        if not redis_client:
            return # Fail open if Redis is not connected
            
        client_ip = request.client.host
        # Use path in key to allow different limits per endpoint
        key = f"ratelimit:{request.url.path}:{client_ip}"
        
        try:
            # Increment and get value
            current = await redis_client.incr(key)
            
            # If new key, set expiry (60s)
            if current == 1:
                await redis_client.expire(key, 60)
            
            if current > self.requests_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Rate limit error: {e}")
            # Fail open on redis errors to not block legitimate users during outages
            pass

# Aggregator
aggregator = WeatherAggregator()


# Request/Response models
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100, description="City name to search")
    language: str = Field("en", pattern=r"^[a-z]{2}(-[a-zA-Z]{2})?$", max_length=5)


class WeatherRequest(BaseModel):
    location_name: str = Field(..., min_length=2, max_length=100)
    days: int = Field(7, ge=1, le=16)
    language: str = Field("en", pattern=r"^[a-z]{2}(-[a-zA-Z]{2})?$", max_length=5)


class CoordinatesRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    days: int = Field(7, ge=1, le=16)
    language: str = Field("en", pattern=r"^[a-z]{2}(-[a-zA-Z]{2})?$", max_length=5)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Weather MCP API"}


@app.post("/redis-check") # Debug endpoint
async def check_redis():
    return {"enabled": bool(redis_client)}

from fastapi import Depends

@app.post("/search", dependencies=[Depends(RateLimiter(requests_per_minute=30))])
async def search_location(request: SearchRequest, response: Response):
    """Search for locations by name."""
    try:
        # Cache: 24h (Static data)
        cache_key = f"geo:search:{request.query.lower()}:{request.language}"
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached
        
        locations = await open_meteo.search_location(request.query, request.language)
        data = [loc.model_dump() for loc in locations]
        
        await set_cached_weather(cache_key, data, ttl_seconds=86400) # 24h
        response.headers["X-Cache-Status"] = "MISS"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/current", dependencies=[Depends(RateLimiter(requests_per_minute=10))])
async def get_current_weather(request: WeatherRequest, response: Response):
    """Get current weather with AI summary."""
    try:
        # Cache: 30m (Dynamic data)
        cache_key = f"weather:current:{request.location_name.lower()}:{request.language}"
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached

        # Search for location
        locations = await open_meteo.search_location(request.location_name)
        if not locations:
            raise HTTPException(status_code=404, detail=f"Location '{request.location_name}' not found")
        
        location = locations[0]
        weather = await open_meteo.get_weather(location, days=1)
        
        # Get AI aggregation
        aggregated = await aggregator.aggregate([weather], request.language)
        
        # Get ambient theme
        from datetime import datetime
        current_hour = datetime.now().hour
        theme = await aggregator.get_ambient_theme(
            weather.current,
            weather.astronomy,
            current_hour
        )
        
        response_data = {
            "location": aggregated.location.model_dump(),
            "current": aggregated.current.model_dump() if aggregated.current else None,
            "astronomy": aggregated.astronomy.model_dump() if aggregated.astronomy else None,
            "ai_summary": aggregated.ai_summary,
            "confidence": aggregated.confidence_score,
            "ambient_theme": theme,
            "sources": aggregated.sources_used
        }
        
        await set_cached_weather(cache_key, response_data, ttl_seconds=1800) # 30m
        response.headers["X-Cache-Status"] = "MISS"
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/forecast", dependencies=[Depends(RateLimiter(requests_per_minute=10))])
async def get_weather_forecast(request: WeatherRequest, response: Response):
    """Get weather forecast with AI analysis from multiple sources."""
    try:
        # Cache: 30m (Dynamic + AI cost)
        cache_key = f"weather:forecast:{request.location_name.lower()}:{request.days}:{request.language}"
        
        # Try cache
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached

        # Search for location using Open-Meteo (always available)
        locations = await open_meteo.search_location(request.location_name)
        if not locations:
            raise HTTPException(status_code=404, detail=f"Location '{request.location_name}' not found")
        
        location = locations[0]
        
        # Collect weather data from all available providers
        weather_data_list: list[WeatherData] = []
        
        for provider_name, provider in providers:
            try:
                weather = await provider.get_weather(location, days=min(request.days, 16))
                weather_data_list.append(weather)
            except Exception as e:
                print(f"Provider {provider_name} failed: {e}")
                continue
        
        if not weather_data_list:
            raise HTTPException(status_code=500, detail="All weather providers failed")
        
        # AI Aggregation - deduce best values from all sources
        aggregated = await aggregator.aggregate(weather_data_list, request.language)
        
        # Get ambient theme
        from datetime import datetime
        current_hour = datetime.now().hour
        theme = await aggregator.get_ambient_theme(
            aggregated.current,
            aggregated.astronomy,
            current_hour
        )
        
        response_data = {
            "location": aggregated.location.model_dump(),
            "current": aggregated.current.model_dump() if aggregated.current else None,
            "daily_forecast": [day.model_dump() for day in aggregated.daily_forecast],
            "hourly_forecast": [hour.model_dump() for hour in aggregated.hourly_forecast],
            "astronomy": aggregated.astronomy.model_dump() if aggregated.astronomy else None,
            "ai_summary": aggregated.ai_summary,
            "confidence": aggregated.confidence_score,
            "ambient_theme": theme,
            "sources": aggregated.sources_used,
            "provider_count": len(weather_data_list)
        }
        
        # Save to cache
        await set_cached_weather(cache_key, response_data, ttl_seconds=1800) # 30m
        
        response.headers["X-Cache-Status"] = "MISS"
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/coordinates", dependencies=[Depends(RateLimiter(requests_per_minute=20))])
async def get_weather_by_coordinates(request: CoordinatesRequest, response: Response):
    """Get weather by coordinates (for geolocation)."""
    try:
        # Cache: 30m for weather, but reverse geo could be cached longer.
        # Since this returns weather, keep 30m.
        cache_key = f"weather:coords:{request.latitude}:{request.longitude}:{request.language}"
        
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached

        # Reverse geocode to get city name
        city_name, country = await reverse_geocode(request.latitude, request.longitude)
        
        location = Location(
            name=city_name,
            latitude=request.latitude,
            longitude=request.longitude,
            country=country
        )
        
        weather = await open_meteo.get_weather(location, days=min(request.days, 16))
        
        # Get AI aggregation
        aggregated = await aggregator.aggregate([weather], request.language)
        
        # Get ambient theme
        from datetime import datetime
        current_hour = datetime.now().hour
        theme = await aggregator.get_ambient_theme(
            weather.current,
            weather.astronomy,
            current_hour
        )
        
        response_data = {
            "location": aggregated.location.model_dump(),
            "current": aggregated.current.model_dump() if aggregated.current else None,
            "daily_forecast": [day.model_dump() for day in aggregated.daily_forecast],
            "hourly_forecast": [hour.model_dump() for hour in aggregated.hourly_forecast],
            "astronomy": aggregated.astronomy.model_dump() if aggregated.astronomy else None,
            "ai_summary": aggregated.ai_summary,
            "confidence": aggregated.confidence_score,
            "ambient_theme": theme,
            "sources": aggregated.sources_used
        }
        
        await set_cached_weather(cache_key, response_data, ttl_seconds=1800) # 30m
        response.headers["X-Cache-Status"] = "MISS"
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AuroraRequest(BaseModel):
    latitude: float = 50.0  # Default to Prague
    language: str = "en"


@app.post("/aurora", dependencies=[Depends(RateLimiter(requests_per_minute=20))])
async def get_aurora(request: AuroraRequest, response: Response):
    """Get aurora forecast from NOAA SWPC."""
    try:
        # Cache: 1h (NOAA updates hourly)
        cache_key = f"aurora:{request.latitude}:{request.language}"
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached

        from src.aurora import get_aurora_data
        data = await get_aurora_data(request.latitude, request.language)
        
        await set_cached_weather(cache_key, data, ttl_seconds=3600) # 1h
        response.headers["X-Cache-Status"] = "MISS"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/theme", dependencies=[Depends(RateLimiter(requests_per_minute=30))])
async def get_ambient_theme(request: WeatherRequest, response: Response):
    """Get ambient theme for current weather."""
    try:
        # Cache: 30m (Linked to weather)
        cache_key = f"theme:{request.location_name.lower()}"
        cached = await get_cached_weather(cache_key)
        if cached:
            response.headers["X-Cache-Status"] = "HIT"
            return cached

        locations = await open_meteo.search_location(request.location_name)
        if not locations:
            raise HTTPException(status_code=404, detail=f"Location '{request.location_name}' not found")
        
        location = locations[0]
        weather = await open_meteo.get_weather(location, days=1)
        
        from datetime import datetime
        current_hour = datetime.now().hour
        theme = await aggregator.get_ambient_theme(
            weather.current,
            weather.astronomy,
            current_hour
        )
        
        await set_cached_weather(cache_key, theme, ttl_seconds=1800) # 30m
        response.headers["X-Cache-Status"] = "MISS"
        return theme
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def main():
    """Run the HTTP API server."""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
