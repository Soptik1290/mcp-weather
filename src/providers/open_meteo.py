"""
Open-Meteo weather provider.
Free, no API key required. European weather data.
https://open-meteo.com/
"""

import httpx
from typing import Optional
from src.providers.base import WeatherProvider
from src.models import (
    WeatherData, Location, CurrentWeather, 
    DailyForecast, HourlyForecast, Astronomy
)


# WMO Weather interpretation codes
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_moon_phase_name(phase: float) -> str:
    """Convert moon phase (0-1) to human-readable name."""
    if phase < 0.0625:
        return "New Moon"
    elif phase < 0.1875:
        return "Waxing Crescent"
    elif phase < 0.3125:
        return "First Quarter"
    elif phase < 0.4375:
        return "Waxing Gibbous"
    elif phase < 0.5625:
        return "Full Moon"
    elif phase < 0.6875:
        return "Waning Gibbous"
    elif phase < 0.8125:
        return "Last Quarter"
    elif phase < 0.9375:
        return "Waning Crescent"
    else:
        return "New Moon"


class OpenMeteoProvider(WeatherProvider):
    """Open-Meteo weather provider - free, no API key required."""
    
    name = "open-meteo"
    BASE_URL = "https://api.open-meteo.com/v1"
    GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str, language: str = "en") -> list[Location]:
        """Search for locations by name using Open-Meteo geocoding."""
        response = await self.client.get(
            f"{self.GEOCODING_URL}/search",
            params={
                "name": query,
                "count": 10,
                "language": language,
                "format": "json"
            }
        )
        response.raise_for_status()
        data = response.json()
        
        locations = []
        for result in data.get("results", []):
            locations.append(Location(
                name=result.get("name", ""),
                latitude=result["latitude"],
                longitude=result["longitude"],
                country=result.get("country"),
                timezone=result.get("timezone")
            ))
        
        return locations
    
    async def get_weather(self, location: Location, days: int = 7) -> WeatherData:
        """Fetch weather data from Open-Meteo API."""
        
        # Current weather + forecast request
        response = await self.client.get(
            f"{self.BASE_URL}/forecast",
            params={
                "latitude": location.latitude,
                "longitude": location.longitude,
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "cloud_cover",
                    "pressure_msl",
                    "wind_speed_10m",
                    "wind_direction_10m"
                ],
                "hourly": [
                    "temperature_2m",
                    "weather_code",
                    "precipitation_probability",
                    "wind_speed_10m",
                    "relative_humidity_2m"
                ],
                "daily": [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_probability_max",
                    "precipitation_sum",
                    "wind_speed_10m_max",
                    "uv_index_max",
                    "sunrise",
                    "sunset",
                    "snowfall_sum"
                ],
                "timezone": location.timezone or "auto",
                "forecast_days": min(days, 16)
            }
        )
        response.raise_for_status()
        data = response.json()
        
        # Parse current weather
        current_data = data.get("current", {})
        current = CurrentWeather(
            temperature=current_data.get("temperature_2m", 0),
            feels_like=current_data.get("apparent_temperature"),
            humidity=current_data.get("relative_humidity_2m"),
            wind_speed=current_data.get("wind_speed_10m"),
            wind_direction=current_data.get("wind_direction_10m"),
            weather_code=current_data.get("weather_code"),
            weather_description=WMO_CODES.get(current_data.get("weather_code", 0), "Unknown"),
            pressure=current_data.get("pressure_msl"),
            cloud_cover=current_data.get("cloud_cover")
        )
        
        # Parse daily forecast
        daily_data = data.get("daily", {})
        daily_forecast = []
        dates = daily_data.get("time", [])
        for i, date in enumerate(dates):
            weather_code = daily_data.get("weather_code", [])[i] if i < len(daily_data.get("weather_code", [])) else None
            daily_forecast.append(DailyForecast(
                date=date,
                temperature_max=daily_data.get("temperature_2m_max", [])[i] if i < len(daily_data.get("temperature_2m_max", [])) else 0,
                temperature_min=daily_data.get("temperature_2m_min", [])[i] if i < len(daily_data.get("temperature_2m_min", [])) else 0,
                weather_code=weather_code,
                weather_description=WMO_CODES.get(weather_code, "Unknown") if weather_code else None,
                precipitation_probability=daily_data.get("precipitation_probability_max", [])[i] if i < len(daily_data.get("precipitation_probability_max", [])) else None,
                precipitation_sum=daily_data.get("precipitation_sum", [])[i] if i < len(daily_data.get("precipitation_sum", [])) else None,
                wind_speed_max=daily_data.get("wind_speed_10m_max", [])[i] if i < len(daily_data.get("wind_speed_10m_max", [])) else None,
                uv_index_max=daily_data.get("uv_index_max", [])[i] if i < len(daily_data.get("uv_index_max", [])) else None,
                sunrise=daily_data.get("sunrise", [])[i] if i < len(daily_data.get("sunrise", [])) else None,
                sunset=daily_data.get("sunset", [])[i] if i < len(daily_data.get("sunset", [])) else None,
                snowfall_sum=daily_data.get("snowfall_sum", [])[i] if i < len(daily_data.get("snowfall_sum", [])) else None
            ))
        
        # Parse hourly forecast (next 24 hours from current time)
        from datetime import datetime
        hourly_data = data.get("hourly", {})
        hourly_forecast = []
        all_times = hourly_data.get("time", [])
        
        # Get current hour to filter out past hours
        now = datetime.now()
        current_hour_str = now.strftime("%Y-%m-%dT%H:00")
        
        # Find the index of the current hour or the next available hour
        start_idx = 0
        for i, time_str in enumerate(all_times):
            if time_str >= current_hour_str:
                start_idx = i
                break
        
        # Get all available hours starting from current hour
        times = all_times[start_idx:]
        for i, time in enumerate(times):
            original_idx = start_idx + i
            weather_code = hourly_data.get("weather_code", [])[original_idx] if original_idx < len(hourly_data.get("weather_code", [])) else None
            hourly_forecast.append(HourlyForecast(
                time=time,
                temperature=hourly_data.get("temperature_2m", [])[original_idx] if original_idx < len(hourly_data.get("temperature_2m", [])) else 0,
                weather_code=weather_code,
                weather_description=WMO_CODES.get(weather_code, "Unknown") if weather_code else None,
                precipitation_probability=hourly_data.get("precipitation_probability", [])[original_idx] if original_idx < len(hourly_data.get("precipitation_probability", [])) else None,
                wind_speed=hourly_data.get("wind_speed_10m", [])[original_idx] if original_idx < len(hourly_data.get("wind_speed_10m", [])) else None,
                humidity=hourly_data.get("relative_humidity_2m", [])[original_idx] if original_idx < len(hourly_data.get("relative_humidity_2m", [])) else None
            ))
        
        # Astronomy data (from first day's sunrise/sunset)
        astronomy = None
        if daily_forecast:
            astronomy = Astronomy(
                sunrise=daily_forecast[0].sunrise,
                sunset=daily_forecast[0].sunset
            )
        
        return WeatherData(
            provider=self.name,
            location=location,
            current=current,
            daily_forecast=daily_forecast,
            hourly_forecast=hourly_forecast,
            astronomy=astronomy
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
