"""
MCP Weather Server - AI-powered weather aggregation.
Uses FastMCP to expose weather tools to AI clients.
"""

import os
from dotenv import load_dotenv
load_dotenv()

import asyncio
from datetime import datetime
from mcp.server.fastmcp import FastMCP
from src.providers.open_meteo import OpenMeteoProvider
from src.providers.openweathermap import OpenWeatherMapProvider
from src.providers.weatherapi import WeatherAPIProvider
from src.providers.met_norway import METNorwayProvider
from src.providers.bright_sky import BrightSkyProvider
from src.providers.visualcrossing import VisualCrossingProvider
from src.aggregator import WeatherAggregator
from src.models import Location
import json
import httpx

# Initialize HTTP client for reverse geocoding
http_client = httpx.AsyncClient(timeout=10.0)


async def reverse_geocode(latitude: float, longitude: float) -> tuple[str, str | None]:
    """
    Reverse geocode coordinates to get city name using Nominatim API.
    Returns (city_name, country) tuple.
    """
    try:
        response = await http_client.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={
                "lat": latitude,
                "lon": longitude,
                "format": "json",
                "zoom": 10,  # City level
                "addressdetails": 1
            },
            headers={
                "User-Agent": "MCP-Weather-App/1.0"
            }
        )
        response.raise_for_status()
        data = response.json()
        
        address = data.get("address", {})
        # Try to get city name from various fields
        city = (
            address.get("city") or
            address.get("town") or
            address.get("village") or
            address.get("municipality") or
            address.get("county") or
            data.get("name", f"Location ({latitude:.2f}, {longitude:.2f})")
        )
        country = address.get("country")
        
        return city, country
    except Exception as e:
        print(f"[WARN] Reverse geocoding failed: {e}")
        return f"Location ({latitude:.2f}, {longitude:.2f})", None


# Initialize FastMCP server
mcp = FastMCP("weather-aggregator")

# Initialize components
aggregator = WeatherAggregator()
providers = []

# 1. OpenMeteo (Free, no key required)
try:
    providers.append(OpenMeteoProvider())
    print("[OK] OpenMeteo provider initialized")
except Exception as e:
    print(f"[ERR] Failed to initialize OpenMeteo: {e}")

# 2. OpenWeatherMap
try:
    if os.getenv("OPENWEATHERMAP_API_KEY"):
        providers.append(OpenWeatherMapProvider())
        print("[OK] OpenWeatherMap provider initialized")
except Exception as e:
    print(f"[WARN] OpenWeatherMap not available: {e}")

# 3. WeatherAPI
try:
    if os.getenv("WEATHERAPI_KEY"):
        providers.append(WeatherAPIProvider())
        print("[OK] WeatherAPI provider initialized")
except Exception as e:
    print(f"[WARN] WeatherAPI not available: {e}")

# 4. Visual Crossing
try:
    if os.getenv("VISUALCROSSING_KEY"):
        providers.append(VisualCrossingProvider())
        print("[OK] Visual Crossing provider initialized")
except Exception as e:
    print(f"[WARN] Visual Crossing not available: {e}")

# 5. MET Norway (Free, no key required)
try:
    providers.append(METNorwayProvider())
    print("[OK] MET Norway (Yr.no) provider initialized")
except Exception as e:
    print(f"[WARN] MET Norway not available: {e}")

# 6. Bright Sky / DWD (Free, no key required)
try:
    providers.append(BrightSkyProvider())
    print("[OK] Bright Sky (DWD) provider initialized")
except Exception as e:
    print(f"[WARN] Bright Sky not available: {e}")

if not providers:
    print("[ERR] No weather providers available!")


async def get_all_weather(location: Location, days: int) -> list:
    """Fetch weather from all available providers."""
    tasks = [p.get_weather(location, days=days) for p in providers]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    valid_results = []
    for i, res in enumerate(results):
        if isinstance(res, Exception):
            provider_name = providers[i].__class__.__name__
            print(f"[WARN] Failed to fetch from {provider_name}: {res}")
        else:
            valid_results.append(res)
            
    return valid_results


@mcp.tool()
async def search_location(query: str) -> str:
    """
    Search for a location by name to get coordinates.
    
    Args:
        query: City or location name to search for (e.g., "Prague", "New York")
        
    Returns:
        JSON list of matching locations with name, country, latitude, longitude
    """
    # Use the first available provider for search (usually OpenMeteo)
    if not providers:
        return json.dumps({"error": "No providers available"})
        
    locations = await providers[0].search_location(query)
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
    if not providers:
        return json.dumps({"error": "No providers available"})

    # Search for location using first provider
    locations = await providers[0].search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    
    # Get weather from all providers
    weather_data_list = await get_all_weather(location, days=1)
    
    if not weather_data_list:
        return json.dumps({"error": "Failed to fetch weather data from any provider"})
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate(weather_data_list, language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        aggregated.current,
        aggregated.astronomy,
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
    if not providers:
        return json.dumps({"error": "No providers available"})

    # Search for location
    locations = await providers[0].search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    
    # Get weather from all providers
    weather_data_list = await get_all_weather(location, days=min(days, 16))
    
    if not weather_data_list:
        return json.dumps({"error": "Failed to fetch weather data from any provider"})
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate(weather_data_list, language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        aggregated.current,
        aggregated.astronomy,
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
    # Reverse geocode to get city name
    city_name, country = await reverse_geocode(latitude, longitude)
    
    location = Location(
        name=city_name,
        latitude=latitude,
        longitude=longitude,
        country=country
    )
    
    # Get weather from all providers
    weather_data_list = await get_all_weather(location, days=min(days, 16))
    
    if not weather_data_list:
        return json.dumps({"error": "Failed to fetch weather data from any provider"})
    
    # Get AI aggregation
    aggregated = await aggregator.aggregate(weather_data_list, language)
    
    # Get ambient theme
    current_hour = datetime.now().hour
    theme = await aggregator.get_ambient_theme(
        aggregated.current,
        aggregated.astronomy,
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
    if not providers:
        return json.dumps({"error": "No providers available"})

    locations = await providers[0].search_location(location_name)
    if not locations:
        return json.dumps({"error": f"Location '{location_name}' not found"})
    
    location = locations[0]
    
    # For theme we just need basic weather, using one provider is enough/fastest
    # But for consistency let's use the aggregator if we want best accuracy, 
    # OR just use the first provider for speed since it's just a theme.
    # The original code acted on single provider result passed to aggregator.get_ambient_theme
    # Let's keep it simple and use just the first provider for speed.
    weather = await providers[0].get_weather(location, days=1)
    
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
