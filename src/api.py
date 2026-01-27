"""
HTTP API Server for Weather MCP.
Wraps MCP tools as REST endpoints for frontend access.
"""

# Load .env file FIRST before any other imports
from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from src.providers.open_meteo import OpenMeteoProvider
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

# Initialize providers
providers = []

# Always available - no API key needed
open_meteo = OpenMeteoProvider()
providers.append(("open_meteo", open_meteo))

# OpenWeatherMap - optional
if os.getenv("OPENWEATHERMAP_API_KEY"):
    try:
        from src.providers.openweathermap import OpenWeatherMapProvider
        owm = OpenWeatherMapProvider()
        providers.append(("openweathermap", owm))
        print("✓ OpenWeatherMap provider enabled")
    except Exception as e:
        print(f"✗ OpenWeatherMap failed: {e}")

# WeatherAPI.com - optional
if os.getenv("WEATHERAPI_KEY"):
    try:
        from src.providers.weatherapi import WeatherAPIProvider
        wapi = WeatherAPIProvider()
        providers.append(("weatherapi", wapi))
        print("✓ WeatherAPI.com provider enabled")
    except Exception as e:
        print(f"✗ WeatherAPI failed: {e}")

# Visual Crossing - optional
if os.getenv("VISUALCROSSING_KEY"):
    try:
        from src.providers.visualcrossing import VisualCrossingProvider
        vc = VisualCrossingProvider()
        providers.append(("visualcrossing", vc))
        print("✓ Visual Crossing provider enabled")
    except Exception as e:
        print(f"✗ Visual Crossing failed: {e}")

print(f"Active providers: {[p[0] for p in providers]}")

# Aggregator
aggregator = WeatherAggregator()


# Request/Response models
class SearchRequest(BaseModel):
    query: str


class WeatherRequest(BaseModel):
    location_name: str
    days: int = 7
    language: str = "en"


class CoordinatesRequest(BaseModel):
    latitude: float
    longitude: float
    days: int = 7
    language: str = "en"


@app.get("/")
async def root():
    return {"status": "ok", "service": "Weather MCP API"}


@app.post("/search")
async def search_location(request: SearchRequest):
    """Search for locations by name."""
    try:
        locations = await open_meteo.search_location(request.query)
        return [loc.model_dump() for loc in locations]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/current")
async def get_current_weather(request: WeatherRequest):
    """Get current weather with AI summary."""
    try:
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
        
        return {
            "location": aggregated.location.model_dump(),
            "current": aggregated.current.model_dump() if aggregated.current else None,
            "astronomy": aggregated.astronomy.model_dump() if aggregated.astronomy else None,
            "ai_summary": aggregated.ai_summary,
            "confidence": aggregated.confidence_score,
            "ambient_theme": theme,
            "sources": aggregated.sources_used
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/forecast")
async def get_weather_forecast(request: WeatherRequest):
    """Get weather forecast with AI analysis from multiple sources."""
    try:
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
        
        return {
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/coordinates")
async def get_weather_by_coordinates(request: CoordinatesRequest):
    """Get weather by coordinates (for geolocation)."""
    try:
        location = Location(
            name=f"Location ({request.latitude:.2f}, {request.longitude:.2f})",
            latitude=request.latitude,
            longitude=request.longitude
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
        
        return {
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AuroraRequest(BaseModel):
    latitude: float = 50.0  # Default to Prague
    language: str = "en"


@app.post("/aurora")
async def get_aurora(request: AuroraRequest):
    """Get aurora forecast from NOAA SWPC."""
    try:
        from src.aurora import get_aurora_data
        data = await get_aurora_data(request.latitude, request.language)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/theme")
async def get_ambient_theme(request: WeatherRequest):
    """Get ambient theme for current weather."""
    try:
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
