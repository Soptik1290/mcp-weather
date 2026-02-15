"""
Visual Crossing Weather Provider.
API docs: https://www.visualcrossing.com/weather-api
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


class VisualCrossingProvider(WeatherProvider):
    """Weather provider using Visual Crossing Weather API."""
    
    BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
    
    # Visual Crossing icon to WMO code mapping
    ICON_TO_WMO = {
        "clear-day": 0,
        "clear-night": 0,
        "partly-cloudy-day": 2,
        "partly-cloudy-night": 2,
        "cloudy": 3,
        "rain": 63,
        "showers-day": 80,
        "showers-night": 80,
        "thunder-rain": 95,
        "thunder-showers-day": 95,
        "thunder-showers-night": 95,
        "snow": 73,
        "snow-showers-day": 85,
        "snow-showers-night": 85,
        "fog": 45,
        "wind": 0,
        "hail": 77,
        "sleet": 85,
    }
    
    @staticmethod
    def _safe_int(value) -> Optional[int]:
        """Safely convert value to int, handling floats and None."""
        if value is None:
            return None
        return int(round(value))
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize provider."""
        self.api_key = api_key or os.getenv("VISUALCROSSING_KEY")
        if not self.api_key:
            raise ValueError("VISUALCROSSING_KEY not set")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str) -> list[Location]:
        """Visual Crossing doesn't have a search API, returns empty."""
        return []
    
    async def get_weather(self, location: Location, days: int = 7, language: str = "en") -> WeatherData:
        """Get weather data for a location."""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/{location.latitude},{location.longitude}",
                params={
                    "key": self.api_key,
                    "unitGroup": "metric",
                    "include": "current,days,hours",
                    "contentType": "json",
                    "lang": language,
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse current weather
            current_data = data.get("currentConditions", {})
            icon = current_data.get("icon", "clear-day")
            
            # Temperature is required - use first day's temp if current not available
            temp = current_data.get("temp")
            if temp is None:
                first_day = data.get("days", [{}])[0]
                temp = first_day.get("temp", first_day.get("tempmax", 0))
            
            current = CurrentWeather(
                temperature=temp,
                feels_like=current_data.get("feelslike"),
                humidity=self._safe_int(current_data.get("humidity")),
                wind_speed=current_data.get("windspeed"),
                wind_direction=self._safe_int(current_data.get("winddir")),
                weather_code=self.ICON_TO_WMO.get(icon, 0),
                weather_description=current_data.get("conditions", ""),
                uv_index=current_data.get("uvindex"),
                visibility=current_data.get("visibility"),
                pressure=current_data.get("pressure"),
                cloud_cover=self._safe_int(current_data.get("cloudcover")),
            )
            
            # Parse daily forecast
            daily_forecast = []
            for day_data in data.get("days", [])[:days]:
                icon = day_data.get("icon", "clear-day")
                daily_forecast.append(DailyForecast(
                    date=day_data.get("datetime"),
                    temperature_max=day_data.get("tempmax"),
                    temperature_min=day_data.get("tempmin"),
                    weather_code=self.ICON_TO_WMO.get(icon, 0),
                    weather_description=day_data.get("conditions", ""),
                    precipitation_probability=self._safe_int(day_data.get("precipprob")),
                    precipitation_sum=day_data.get("precip"),
                    wind_speed_max=day_data.get("windspeed"),
                    uv_index_max=day_data.get("uvindex"),
                    sunrise=day_data.get("sunrise"),
                    sunset=day_data.get("sunset"),
                ))
            
            # Parse hourly forecast (first 24 hours)
            hourly_forecast = []
            for day_data in data.get("days", [])[:2]:
                for hour_data in day_data.get("hours", []):
                    icon = hour_data.get("icon", "clear-day")
                    hourly_forecast.append(HourlyForecast(
                        time=f"{day_data.get('datetime')}T{hour_data.get('datetime')}",
                        temperature=hour_data.get("temp"),
                        weather_code=self.ICON_TO_WMO.get(icon, 0),
                        weather_description=hour_data.get("conditions", ""),
                        precipitation_probability=self._safe_int(hour_data.get("precipprob")),
                        wind_speed=hour_data.get("windspeed"),
                        humidity=self._safe_int(hour_data.get("humidity")),
                    ))
            
            # Astronomy from first day
            first_day = data.get("days", [{}])[0]
            astronomy = Astronomy(
                sunrise=first_day.get("sunrise"),
                sunset=first_day.get("sunset"),
                moon_phase=first_day.get("moonphase"),
            )
            
            return WeatherData(
                provider="visualcrossing",
                location=location,
                current=current,
                daily_forecast=daily_forecast,
                hourly_forecast=hourly_forecast[:24],
                astronomy=astronomy,
            )
            
        except Exception as e:
            print(f"Visual Crossing error: {e}")
            raise
