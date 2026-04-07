"""
WeatherBit API Provider.
API docs: https://www.weatherbit.io/api
"""

import os
import httpx
from datetime import datetime
from typing import Optional

from src.providers.base import WeatherProvider
from src.models import (
    Location, WeatherData, CurrentWeather, 
    DailyForecast, HourlyForecast
)


class WeatherBitProvider(WeatherProvider):
    """Weather provider using WeatherBit API v2.0."""
    
    BASE_URL = "https://api.weatherbit.io/v2.0"
    
    # WeatherBit condition code to WMO code mapping
    WB_TO_WMO = {
        # Thunderstorm
        200: 95, 201: 95, 202: 99, 230: 95, 231: 95, 232: 99, 233: 99,
        # Drizzle
        300: 51, 301: 53, 302: 55,
        # Rain
        500: 61, 501: 63, 502: 65, 511: 66, 520: 80, 521: 81, 522: 82,
        # Snow
        600: 71, 601: 73, 602: 75, 610: 86, 611: 85, 612: 85, 621: 73, 622: 75, 623: 75,
        # Atmosphere (Fog, Mist, etc.)
        700: 45, 711: 45, 721: 45, 731: 45, 741: 45, 751: 45,
        # Clear
        800: 0,
        # Clouds
        801: 1, 802: 2, 803: 3, 804: 3,
        # Extreme
        900: 0  # Unknown prep
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("WEATHERBIT_API_KEY")
        if not self.api_key:
            raise ValueError("WEATHERBIT_API_KEY not set")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str, language: str = "en") -> list[Location]:
        # WeatherBit doesn't have a great free standalone geocoding, relying on others if needed, 
        # or we implement basic city search. For now return empty as aggregator usually handles this via OpenMeteo mapping.
        return []

    async def get_weather(self, location: Location, days: int = 7, language: str = "en") -> WeatherData:
        """Get weather data for a location."""
        # Convert language code if needed. WeatherBit uses 'en', 'cz' (not 'cs')
        lang_code = "cz" if language == "cs" else language

        # 1. Get current weather
        try:
            current = await self._get_current(location, lang_code)
        except httpx.HTTPStatusError as e:
            # If 429 Too Many Requests or 403, we should fail provider gracefully
            print(f"[ERR] WeatherBit current weather failed: {e}")
            raise
        
        # 2. Get daily forecast
        try:
            daily = await self._get_daily(location, days, lang_code)
        except Exception as e:
            print(f"[WARN] WeatherBit daily forecast failed: {e}")
            daily = []

        # 3. Get hourly forecast - Free tier dostává často 403 u hourly 
        try:
            hourly = await self._get_hourly(location, lang_code)
        except Exception as e:
            print(f"[WARN] WeatherBit hourly forecast failed (Possible Free tier limit): {e}")
            hourly = []
        
        return WeatherData(
            provider="weatherbit",
            location=location,
            current=current,
            daily_forecast=daily,
            hourly_forecast=hourly,
            astronomy=None, # Astronomy might require separate endpoints/tiers
        )

    async def _get_current(self, location: Location, language: str) -> CurrentWeather:
        response = await self.client.get(
            f"{self.BASE_URL}/current",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "key": self.api_key,
                "lang": language
            }
        )
        response.raise_for_status()
        data = response.json().get("data", [])[0]
        
        weather_code = data.get("weather", {}).get("code", 800)
        
        return CurrentWeather(
            temperature=data.get("temp", 0),
            feels_like=data.get("app_temp"),
            humidity=data.get("rh"),
            wind_speed=data.get("wind_spd", 0) * 3.6, # m/s to km/h
            wind_direction=data.get("wind_dir"),
            weather_code=self.WB_TO_WMO.get(weather_code, 0),
            weather_description=data.get("weather", {}).get("description", "Unknown"),
            pressure=data.get("pres"),
            cloud_cover=data.get("clouds"),
            visibility=data.get("vis"),
            uv_index=data.get("uv")
        )

    async def _get_daily(self, location: Location, days: int, language: str) -> list[DailyForecast]:
        response = await self.client.get(
            f"{self.BASE_URL}/forecast/daily",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "key": self.api_key,
                "days": days,
                "lang": language
            }
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        
        daily = []
        for item in data:
            weather_code = item.get("weather", {}).get("code", 800)
            
            daily.append(DailyForecast(
                date=item.get("datetime"),
                temperature_max=item.get("max_temp", 0),
                temperature_min=item.get("min_temp", 0),
                weather_code=self.WB_TO_WMO.get(weather_code, 0),
                weather_description=item.get("weather", {}).get("description", "Unknown"),
                precipitation_probability=item.get("pop", 0),
                precipitation_sum=item.get("precip", 0),
                wind_speed_max=item.get("wind_spd", 0) * 3.6,
                uv_index_max=item.get("uv", 0),
                sunrise=item.get("sunrise_ts"), # these are UTC timestamps, models might need formatting
                sunset=item.get("sunset_ts")
            ))
            
        return daily

    async def _get_hourly(self, location: Location, language: str) -> list[HourlyForecast]:
        # Typically 48 hours for standard tier
        response = await self.client.get(
            f"{self.BASE_URL}/forecast/hourly",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "key": self.api_key,
                "hours": 24,
                "lang": language
            }
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        
        hourly = []
        for item in data:
            weather_code = item.get("weather", {}).get("code", 800)
            
            # WeatherBit returns 'timestamp_local' like "2023-10-15T12:00:00"
            dt_str = item.get("timestamp_local")
            if not dt_str:
                dt_str = datetime.fromtimestamp(item.get("ts")).isoformat()

            hourly.append(HourlyForecast(
                time=dt_str,
                temperature=item.get("temp", 0),
                weather_code=self.WB_TO_WMO.get(weather_code, 0),
                weather_description=item.get("weather", {}).get("description", "Unknown"),
                precipitation_probability=item.get("pop", 0),
                wind_speed=item.get("wind_spd", 0) * 3.6,
                humidity=item.get("rh", 0),
                pressure=item.get("pres"),
                precipitation_amount=item.get("precip"),
            ))
            
        return hourly
