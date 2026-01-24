"""
HTTP API Server for Weather MCP.
Wraps MCP tools as REST endpoints for frontend access.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from src.providers.open_meteo import OpenMeteoProvider
from src.aggregator import WeatherAggregator
from src.models import Location

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

# Initialize components
open_meteo = OpenMeteoProvider()
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
    """Get weather forecast with AI analysis."""
    try:
        # Search for location
        locations = await open_meteo.search_location(request.location_name)
        if not locations:
            raise HTTPException(status_code=404, detail=f"Location '{request.location_name}' not found")
        
        location = locations[0]
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
