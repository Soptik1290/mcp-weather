
"""
Shared services for MCP Weather backend.
Handles provider initialization and common utilities.
"""
import os
import httpx
from typing import Tuple, Optional, List
from src.providers.open_meteo import OpenMeteoProvider
from src.models import Location
from src.aggregator import WeatherAggregator

# --- Service Instances ---
_http_client = httpx.AsyncClient(timeout=10.0)
aggregator = WeatherAggregator()

# --- Geocoding ---
async def reverse_geocode(latitude: float, longitude: float) -> Tuple[str, Optional[str]]:
    """
    Reverse geocode coordinates to get city name using Nominatim API.
    Returns (city_name, country) tuple.
    """
    try:
        response = await _http_client.get(
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

# --- Provider Factory ---
def initialize_providers() -> List[tuple[str, object]]:
    """
    Initialize all available weather providers based on env vars.
    Returns list of (name_id, provider_instance) tuples.
    """
    providers = []

    # 1. OpenMeteo (Free, no key required)
    try:
        open_meteo = OpenMeteoProvider()
        providers.append(("open_meteo", open_meteo))
        print("[OK] OpenMeteo provider initialized")
    except Exception as e:
        print(f"[ERR] Failed to initialize OpenMeteo: {e}")

    # 2. OpenWeatherMap
    if os.getenv("OPENWEATHERMAP_API_KEY"):
        try:
            from src.providers.openweathermap import OpenWeatherMapProvider
            owm = OpenWeatherMapProvider()
            providers.append(("openweathermap", owm))
            print("[OK] OpenWeatherMap provider initialized")
        except Exception as e:
            print(f"[WARN] OpenWeatherMap failed: {e}")

    # 3. WeatherAPI
    if os.getenv("WEATHERAPI_KEY"):
        try:
            from src.providers.weatherapi import WeatherAPIProvider
            wapi = WeatherAPIProvider()
            providers.append(("weatherapi", wapi))
            print("[OK] WeatherAPI provider initialized")
        except Exception as e:
            print(f"[WARN] WeatherAPI failed: {e}")

    # 4. Visual Crossing
    if os.getenv("VISUALCROSSING_KEY"):
        try:
            from src.providers.visualcrossing import VisualCrossingProvider
            vc = VisualCrossingProvider()
            providers.append(("visualcrossing", vc))
            print("[OK] Visual Crossing provider initialized")
        except Exception as e:
            print(f"[WARN] Visual Crossing failed: {e}")

    # 5. MET Norway (Free)
    try:
        from src.providers.met_norway import METNorwayProvider
        met_norway = METNorwayProvider()
        providers.append(("met_norway", met_norway))
        print("[OK] MET Norway (Yr.no) provider initialized")
    except Exception as e:
        print(f"[WARN] MET Norway failed: {e}")

    # 6. Bright Sky / DWD (Free)
    try:
        from src.providers.bright_sky import BrightSkyProvider
        bright_sky = BrightSkyProvider()
        providers.append(("bright_sky", bright_sky))
        print("[OK] Bright Sky (DWD) provider initialized")
    except Exception as e:
        print(f"[WARN] Bright Sky failed: {e}")
        
    return providers

def get_open_meteo_provider(providers_list):
    """Helper to get OpenMeteo provider specifically (primary fallback)."""
    for name, p in providers_list:
        if name == "open_meteo":
            return p
    return OpenMeteoProvider() # Fallback new instance if missing (unlikely)
