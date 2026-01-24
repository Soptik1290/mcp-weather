"""
MCP Weather Server - AI-powered weather aggregation.
Uses FastMCP to expose weather tools to AI clients.
"""

import os
from datetime import datetime
from mcp.server.fastmcp import FastMCP
from src.providers.open_meteo import OpenMeteoProvider
from src.aggregator import WeatherAggregator
from src.models import Location
import json

# Initialize FastMCP server
mcp = FastMCP("weather-aggregator")

# Initialize components
open_meteo = OpenMeteoProvider()
aggregator = WeatherAggregator()


@mcp.tool()
async def search_location(query: str) -> str:
    """
    Search for a location by name to get coordinates.
    
    Args:
        query: City or location name to search for (e.g., "Prague", "New York")
        
    Returns:
        JSON list of matching locations with name, country, latitude, longitude
    """
    locations = await open_meteo.search_location(query)
    return json.dumps([loc.model_dump() for loc in locations], indent=2)


@mcp.tool()
async def get_current_weather(location_name: str, language: str = "en") -> str:
    """
    Get current weather conditions with AI-powered summary.
    
    Args:
        location_name: Name of the city/location (e.g., "Prague", "London")
        language: Language for AI summary (en, cs)
        
    Returns:
        JSON with current weather, AI summary, and ambient theme
    """
    # Search for location
    locations = await open_meteo.search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    weather = await open_meteo.get_weather(location, days=1)
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate([weather], language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        weather.current,
        weather.astronomy,
        current_hour
    )
    
    result = {
        "location": aggregated.location.model_dump(),
        "current": aggregated.current.model_dump() if aggregated.current else None,
        "astronomy": aggregated.astronomy.model_dump() if aggregated.astronomy else None,
        "ai_summary": aggregated.ai_summary,
        "confidence": aggregated.confidence_score,
        "ambient_theme": theme,
        "sources": aggregated.sources_used
    }
    
    return json.dumps(result, indent=2, default=str)


@mcp.tool()
async def get_weather_forecast(location_name: str, days: int = 7, language: str = "en") -> str:
    """
    Get weather forecast with AI-powered analysis.
    
    Args:
        location_name: Name of the city/location (e.g., "Prague", "London")
        days: Number of forecast days (1-16, default 7)
        language: Language for AI summary (en, cs)
        
    Returns:
        JSON with forecast, AI analysis, and ambient theme
    """
    # Search for location
    locations = await open_meteo.search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    weather = await open_meteo.get_weather(location, days=min(days, 16))
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate([weather], language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        weather.current,
        weather.astronomy,
        current_hour
    )
    
    result = {
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
    
    return json.dumps(result, indent=2, default=str)


@mcp.tool()
async def get_weather_by_coordinates(
    latitude: float, 
    longitude: float, 
    days: int = 7,
    language: str = "en"
) -> str:
    """
    Get weather forecast using exact coordinates with AI analysis.
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location  
        days: Number of forecast days (1-16, default 7)
        language: Language for AI summary (en, cs)
        
    Returns:
        JSON with complete weather data, AI analysis, and ambient theme
    """
    location = Location(
        name=f"Location ({latitude:.2f}, {longitude:.2f})",
        latitude=latitude,
        longitude=longitude
    )
    
    weather = await open_meteo.get_weather(location, days=min(days, 16))
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate([weather], language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        weather.current,
        weather.astronomy,
        current_hour
    )
    
    result = {
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
    
    return json.dumps(result, indent=2, default=str)


@mcp.tool()
async def get_ambient_theme(location_name: str) -> str:
    """
    Get the ambient theme (colors/mood) for current weather conditions.
    
    Args:
        location_name: Name of the city/location
        
    Returns:
        JSON with theme name, gradient colors, and special effects
    """
    locations = await open_meteo.search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    weather = await open_meteo.get_weather(location, days=1)
    
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        weather.current,
        weather.astronomy,
        current_hour
    )
    
    return json.dumps(theme, indent=2)


def main():
    """Run the MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
