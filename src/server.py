"""
MCP Weather Server - AI-powered weather aggregation.
Uses FastMCP to expose weather tools to AI clients.
"""

from mcp.server.fastmcp import FastMCP
from src.providers.open_meteo import OpenMeteoProvider
from src.models import Location
import json

# Initialize FastMCP server
mcp = FastMCP("weather-aggregator")

# Initialize weather providers
open_meteo = OpenMeteoProvider()


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
async def get_current_weather(location_name: str) -> str:
    """
    Get current weather conditions for a location.
    
    Args:
        location_name: Name of the city/location (e.g., "Prague", "London")
        
    Returns:
        JSON with current temperature, conditions, humidity, wind, etc.
    """
    # First search for location
    locations = await open_meteo.search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    weather = await open_meteo.get_weather(location, days=1)
    
    result = {
        "location": weather.location.model_dump(),
        "current": weather.current.model_dump() if weather.current else None,
        "astronomy": weather.astronomy.model_dump() if weather.astronomy else None,
        "provider": weather.provider
    }
    
    return json.dumps(result, indent=2, default=str)


@mcp.tool()
async def get_weather_forecast(location_name: str, days: int = 7) -> str:
    """
    Get weather forecast for a location.
    
    Args:
        location_name: Name of the city/location (e.g., "Prague", "London")
        days: Number of forecast days (1-16, default 7)
        
    Returns:
        JSON with daily and hourly forecast, sunrise/sunset, and weather conditions
    """
    # First search for location
    locations = await open_meteo.search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    weather = await open_meteo.get_weather(location, days=min(days, 16))
    
    result = {
        "location": weather.location.model_dump(),
        "current": weather.current.model_dump() if weather.current else None,
        "daily_forecast": [day.model_dump() for day in weather.daily_forecast],
        "hourly_forecast": [hour.model_dump() for hour in weather.hourly_forecast],
        "astronomy": weather.astronomy.model_dump() if weather.astronomy else None,
        "provider": weather.provider
    }
    
    return json.dumps(result, indent=2, default=str)


@mcp.tool()
async def get_weather_by_coordinates(latitude: float, longitude: float, days: int = 7) -> str:
    """
    Get weather forecast using exact coordinates.
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location  
        days: Number of forecast days (1-16, default 7)
        
    Returns:
        JSON with complete weather data for the coordinates
    """
    location = Location(
        name=f"Location ({latitude:.2f}, {longitude:.2f})",
        latitude=latitude,
        longitude=longitude
    )
    
    weather = await open_meteo.get_weather(location, days=min(days, 16))
    
    result = {
        "location": weather.location.model_dump(),
        "current": weather.current.model_dump() if weather.current else None,
        "daily_forecast": [day.model_dump() for day in weather.daily_forecast],
        "hourly_forecast": [hour.model_dump() for hour in weather.hourly_forecast],
        "astronomy": weather.astronomy.model_dump() if weather.astronomy else None,
        "provider": weather.provider
    }
    
    return json.dumps(result, indent=2, default=str)


def main():
    """Run the MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
