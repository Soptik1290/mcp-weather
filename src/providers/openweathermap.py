"""
OpenWeatherMap Weather Provider.
API docs: https://openweathermap.org/api
Free tier: 1,000 calls/day
"""

import os
from typing import Optional
import httpx
from datetime import datetime

from src.providers.base import WeatherProvider
from src.models import (
    Location, WeatherData, CurrentWeather, 
    DailyForecast, HourlyForecast, Astronomy
)


class OpenWeatherMapProvider(WeatherProvider):
    """Weather provider using OpenWeatherMap API."""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    GEO_URL = "https://api.openweathermap.org/geo/1.0"
    
    # OpenWeatherMap condition code to WMO code mapping (approximate)
    OWM_TO_WMO = {
        # Thunderstorm
        200: 95, 201: 95, 202: 99, 210: 95, 211: 95, 212: 99, 221: 95, 230: 95, 231: 95, 232: 95,
        # Drizzle
        300: 51, 301: 53, 302: 55, 310: 51, 311: 53, 312: 55, 313: 53, 314: 55, 321: 55,
        # Rain
        500: 61, 501: 63, 502: 65, 503: 65, 504: 65, 511: 66, 520: 80, 521: 81, 522: 82, 531: 82,
        # Snow
        600: 71, 601: 73, 602: 75, 611: 85, 612: 85, 613: 86, 615: 71, 616: 73, 620: 71, 621: 73, 622: 75,
        # Atmosphere
        701: 45, 711: 45, 721: 45, 731: 45, 741: 45, 751: 45, 761: 45, 762: 45, 771: 45, 781: 45,
        # Clear
        800: 0,
        # Clouds
        801: 1, 802: 2, 803: 3, 804: 3,
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize provider.
        
        Args:
            api_key: OpenWeatherMap API key (defaults to env var)
        """
        self.api_key = api_key or os.getenv("OPENWEATHERMAP_API_KEY")
        if not self.api_key:
            raise ValueError("OPENWEATHERMAP_API_KEY not set")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str) -> list[Location]:
        """Search for locations by name."""
        try:
            response = await self.client.get(
                f"{self.GEO_URL}/direct",
                params={
                    "q": query,
                    "limit": 5,
                    "appid": self.api_key,
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return [
                Location(
                    name=item.get("name", "Unknown"),
                    latitude=item["lat"],
                    longitude=item["lon"],
                    country=item.get("country"),
                )
                for item in data
            ]
        except Exception as e:
            print(f"OpenWeatherMap search error: {e}")
            return []
    
    async def get_weather(self, location: Location, days: int = 7) -> WeatherData:
        """Get weather data for a location."""
        # Get current weather
        current = await self._get_current(location)
        
        # Get 5-day/3-hour forecast (free tier)
        daily, hourly = await self._get_forecast(location)
        
        return WeatherData(
            provider="openweathermap",
            location=location,
            current=current,
            daily_forecast=daily[:days],
            hourly_forecast=hourly[:24],
            astronomy=None,  # Not available in free tier
        )
    
    async def _get_current(self, location: Location) -> CurrentWeather:
        """Get current weather conditions."""
        response = await self.client.get(
            f"{self.BASE_URL}/weather",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "appid": self.api_key,
                "units": "metric",
            }
        )
        response.raise_for_status()
        data = response.json()
        
        weather_id = data["weather"][0]["id"] if data.get("weather") else 800
        
        return CurrentWeather(
            temperature=data["main"]["temp"],
            feels_like=data["main"].get("feels_like"),
            humidity=data["main"].get("humidity"),
            wind_speed=data["wind"].get("speed", 0) * 3.6,  # m/s to km/h
            wind_direction=data["wind"].get("deg"),
            weather_code=self.OWM_TO_WMO.get(weather_id, 0),
            weather_description=data["weather"][0].get("description", "").title() if data.get("weather") else "",
            pressure=data["main"].get("pressure"),
            cloud_cover=data["clouds"].get("all"),
            visibility=data.get("visibility", 0) / 1000 if data.get("visibility") else None,  # m to km
        )
    
    async def _get_forecast(self, location: Location) -> tuple[list[DailyForecast], list[HourlyForecast]]:
        """Get 5-day/3-hour forecast."""
        response = await self.client.get(
            f"{self.BASE_URL}/forecast",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "appid": self.api_key,
                "units": "metric",
            }
        )
        response.raise_for_status()
        data = response.json()
        
        hourly = []
        daily_temps: dict[str, dict] = {}
        
        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"])
            date_str = dt.strftime("%Y-%m-%d")
            weather_id = item["weather"][0]["id"] if item.get("weather") else 800
            
            # Hourly forecast
            hourly.append(HourlyForecast(
                time=dt.isoformat(),
                temperature=item["main"]["temp"],
                weather_code=self.OWM_TO_WMO.get(weather_id, 0),
                weather_description=item["weather"][0].get("description", "").title() if item.get("weather") else "",
                precipitation_probability=int(item.get("pop", 0) * 100),
                wind_speed=item["wind"].get("speed", 0) * 3.6,
                humidity=item["main"].get("humidity"),
            ))
            
            # Aggregate for daily
            if date_str not in daily_temps:
                daily_temps[date_str] = {
                    "temps": [],
                    "weather_id": weather_id,
                    "description": item["weather"][0].get("description", "").title() if item.get("weather") else "",
                    "pop": [],
                }
            daily_temps[date_str]["temps"].append(item["main"]["temp"])
            daily_temps[date_str]["pop"].append(item.get("pop", 0))
        
        # Build daily forecast from aggregated data
        daily = []
        for date_str, info in sorted(daily_temps.items()):
            daily.append(DailyForecast(
                date=date_str,
                temperature_max=max(info["temps"]),
                temperature_min=min(info["temps"]),
                weather_code=self.OWM_TO_WMO.get(info["weather_id"], 0),
                weather_description=info["description"],
                precipitation_probability=int(max(info["pop"]) * 100) if info["pop"] else None,
            ))
        
        return daily, hourly
