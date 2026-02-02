"""
WeatherAPI.com Weather Provider.
API docs: https://www.weatherapi.com/docs/
Free tier: 1,000,000 calls/month
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


class WeatherAPIProvider(WeatherProvider):
    """Weather provider using WeatherAPI.com."""
    
    BASE_URL = "https://api.weatherapi.com/v1"
    
    # WeatherAPI condition code to WMO code mapping
    CONDITION_TO_WMO = {
        1000: 0,   # Sunny/Clear
        1003: 1,   # Partly cloudy
        1006: 2,   # Cloudy
        1009: 3,   # Overcast
        1030: 45,  # Mist
        1063: 51,  # Patchy rain possible
        1066: 71,  # Patchy snow possible
        1069: 66,  # Patchy sleet possible
        1072: 56,  # Patchy freezing drizzle
        1087: 95,  # Thundery outbreaks possible
        1114: 71,  # Blowing snow
        1117: 75,  # Blizzard
        1135: 45,  # Fog
        1147: 48,  # Freezing fog
        1150: 51,  # Patchy light drizzle
        1153: 51,  # Light drizzle
        1168: 56,  # Freezing drizzle
        1171: 57,  # Heavy freezing drizzle
        1180: 61,  # Patchy light rain
        1183: 61,  # Light rain
        1186: 63,  # Moderate rain at times
        1189: 63,  # Moderate rain
        1192: 65,  # Heavy rain at times
        1195: 65,  # Heavy rain
        1198: 66,  # Light freezing rain
        1201: 67,  # Moderate or heavy freezing rain
        1204: 85,  # Light sleet
        1207: 86,  # Moderate or heavy sleet
        1210: 71,  # Patchy light snow
        1213: 71,  # Light snow
        1216: 73,  # Patchy moderate snow
        1219: 73,  # Moderate snow
        1222: 75,  # Patchy heavy snow
        1225: 75,  # Heavy snow
        1237: 77,  # Ice pellets
        1240: 80,  # Light rain shower
        1243: 81,  # Moderate or heavy rain shower
        1246: 82,  # Torrential rain shower
        1249: 85,  # Light sleet showers
        1252: 86,  # Moderate or heavy sleet showers
        1255: 85,  # Light snow showers
        1258: 86,  # Moderate or heavy snow showers
        1261: 77,  # Light showers of ice pellets
        1264: 77,  # Moderate or heavy showers of ice pellets
        1273: 95,  # Patchy light rain with thunder
        1276: 99,  # Moderate or heavy rain with thunder
        1279: 95,  # Patchy light snow with thunder
        1282: 99,  # Moderate or heavy snow with thunder
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize provider."""
        self.api_key = api_key or os.getenv("WEATHERAPI_KEY")
        if not self.api_key:
            raise ValueError("WEATHERAPI_KEY not set")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str) -> list[Location]:
        """Search for locations by name."""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/search.json",
                params={"key": self.api_key, "q": query}
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
            print(f"WeatherAPI search error: {e}")
            return []
    
    async def get_weather(self, location: Location, days: int = 7) -> WeatherData:
        """Get weather data for a location."""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/forecast.json",
                params={
                    "key": self.api_key,
                    "q": f"{location.latitude},{location.longitude}",
                    "days": min(days, 14),  # WeatherAPI max 14 days
                    "aqi": "no",
                    "alerts": "no",
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse current weather
            current_data = data.get("current", {})
            condition_code = current_data.get("condition", {}).get("code", 1000)
            
            current = CurrentWeather(
                temperature=current_data.get("temp_c"),
                feels_like=current_data.get("feelslike_c"),
                humidity=current_data.get("humidity"),
                wind_speed=current_data.get("wind_kph"),
                wind_direction=current_data.get("wind_degree"),
                weather_code=self.CONDITION_TO_WMO.get(condition_code, 0),
                weather_description=current_data.get("condition", {}).get("text", ""),
                uv_index=current_data.get("uv"),
                visibility=current_data.get("vis_km"),
                pressure=current_data.get("pressure_mb"),
                cloud_cover=current_data.get("cloud"),
            )
            
            # Parse daily forecast
            daily_forecast = []
            for day_data in data.get("forecast", {}).get("forecastday", []):
                day = day_data.get("day", {})
                astro = day_data.get("astro", {})
                condition_code = day.get("condition", {}).get("code", 1000)
                
                daily_forecast.append(DailyForecast(
                    date=day_data.get("date"),
                    temperature_max=day.get("maxtemp_c"),
                    temperature_min=day.get("mintemp_c"),
                    weather_code=self.CONDITION_TO_WMO.get(condition_code, 0),
                    weather_description=day.get("condition", {}).get("text", ""),
                    precipitation_probability=day.get("daily_chance_of_rain"),
                    precipitation_sum=day.get("totalprecip_mm"),
                    wind_speed_max=day.get("maxwind_kph"),
                    uv_index_max=day.get("uv"),
                    sunrise=astro.get("sunrise"),
                    sunset=astro.get("sunset"),
                ))
            
            # Parse hourly forecast
            hourly_forecast = []
            for day_data in data.get("forecast", {}).get("forecastday", []):
                for hour_data in day_data.get("hour", []):
                    condition_code = hour_data.get("condition", {}).get("code", 1000)
                    hourly_forecast.append(HourlyForecast(
                        time=hour_data.get("time"),
                        temperature=hour_data.get("temp_c"),
                        weather_code=self.CONDITION_TO_WMO.get(condition_code, 0),
                        weather_description=hour_data.get("condition", {}).get("text", ""),
                        precipitation_probability=hour_data.get("chance_of_rain"),
                        wind_speed=hour_data.get("wind_kph"),
                        humidity=hour_data.get("humidity"),
                    ))
            
            # Parse astronomy
            astro_data = data.get("forecast", {}).get("forecastday", [{}])[0].get("astro", {})
            astronomy = Astronomy(
                sunrise=astro_data.get("sunrise"),
                sunset=astro_data.get("sunset"),
                moonrise=astro_data.get("moonrise"),
                moonset=astro_data.get("moonset"),
                moon_phase_name=astro_data.get("moon_phase"),
                moon_illumination=astro_data.get("moon_illumination"),
            )
            
            return WeatherData(
                provider="weatherapi",
                location=location,
                current=current,
                daily_forecast=daily_forecast,
                hourly_forecast=hourly_forecast[:24],
                astronomy=astronomy,
            )
            
        except Exception as e:
            print(f"WeatherAPI error: {e}")
            raise
