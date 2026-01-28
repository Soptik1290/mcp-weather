"""
Bright Sky weather provider (DWD - German Weather Service data).
Free, no API key required. Best for Germany/Central Europe.
https://brightsky.dev/docs/
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
from src.providers.base import WeatherProvider
from src.models import (
    WeatherData, Location, CurrentWeather, 
    DailyForecast, HourlyForecast, Astronomy
)


# Bright Sky condition to WMO code mapping
CONDITION_TO_WMO = {
    "clear-day": 0,
    "clear-night": 0,
    "partly-cloudy-day": 2,
    "partly-cloudy-night": 2,
    "cloudy": 3,
    "fog": 45,
    "wind": 1,
    "rain": 63,
    "sleet": 66,
    "snow": 73,
    "hail": 99,
    "thunderstorm": 95,
}

# WMO code to description
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


class BrightSkyProvider(WeatherProvider):
    """Bright Sky (DWD) weather provider - free, no API key required."""
    
    name = "bright_sky"
    BASE_URL = "https://api.brightsky.dev"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_location(self, query: str) -> list[Location]:
        """Search not supported - use Open-Meteo geocoding instead."""
        return []
    
    async def get_weather(self, location: Location, days: int = 7) -> WeatherData:
        """Fetch weather data from Bright Sky API."""
        
        now = datetime.utcnow()
        end_date = now + timedelta(days=days)
        
        # Fetch weather data
        response = await self.client.get(
            f"{self.BASE_URL}/weather",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "date": now.strftime("%Y-%m-%d"),
                "last_date": end_date.strftime("%Y-%m-%d"),
            }
        )
        response.raise_for_status()
        data = response.json()
        
        weather_entries = data.get("weather", [])
        
        if not weather_entries:
            raise ValueError("No weather data received from Bright Sky")
        
        # Parse current weather (most recent entry)
        current_entry = weather_entries[0]
        condition = current_entry.get("condition", "cloudy")
        weather_code = CONDITION_TO_WMO.get(condition, 3)
        
        current = CurrentWeather(
            temperature=current_entry.get("temperature"),
            feels_like=None,  # Not directly provided
            humidity=current_entry.get("relative_humidity"),
            wind_speed=current_entry.get("wind_speed"),  # Already in km/h
            wind_direction=current_entry.get("wind_direction"),
            weather_code=weather_code,
            weather_description=WMO_CODES.get(weather_code, "Unknown"),
            pressure=current_entry.get("pressure_msl"),
            cloud_cover=current_entry.get("cloud_cover")
        )
        
        # Parse hourly forecast (next 24 hours)
        hourly_forecast = []
        current_time = now.strftime("%Y-%m-%dT%H")
        
        hours_added = 0
        for entry in weather_entries:
            timestamp = entry.get("timestamp", "")
            if timestamp >= current_time and hours_added < 24:
                try:
                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    formatted_time = dt.strftime("%Y-%m-%dT%H:00")
                except:
                    formatted_time = timestamp
                
                cond = entry.get("condition", "cloudy")
                code = CONDITION_TO_WMO.get(cond, 3)
                
                hourly_forecast.append(HourlyForecast(
                    time=formatted_time,
                    temperature=entry.get("temperature", 0),
                    weather_code=code,
                    weather_description=WMO_CODES.get(code, "Unknown"),
                    precipitation_probability=entry.get("precipitation_probability"),
                    wind_speed=entry.get("wind_speed"),
                    humidity=entry.get("relative_humidity")
                ))
                hours_added += 1
        
        # Aggregate daily forecast from hourly data
        daily_data = {}
        
        for entry in weather_entries:
            timestamp = entry.get("timestamp", "")
            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                date_key = dt.strftime("%Y-%m-%d")
            except:
                continue
            
            if date_key not in daily_data:
                daily_data[date_key] = {
                    "temps": [],
                    "precip_probs": [],
                    "precip_sums": [],
                    "wind_speeds": [],
                    "codes": [],
                    "sunrise": None,
                    "sunset": None
                }
            
            if entry.get("temperature") is not None:
                daily_data[date_key]["temps"].append(entry["temperature"])
            
            if entry.get("precipitation_probability") is not None:
                daily_data[date_key]["precip_probs"].append(entry["precipitation_probability"])
            
            if entry.get("precipitation") is not None:
                daily_data[date_key]["precip_sums"].append(entry["precipitation"])
            
            if entry.get("wind_speed") is not None:
                daily_data[date_key]["wind_speeds"].append(entry["wind_speed"])
            
            cond = entry.get("condition", "cloudy")
            daily_data[date_key]["codes"].append(CONDITION_TO_WMO.get(cond, 3))
            
            if entry.get("sunrise"):
                daily_data[date_key]["sunrise"] = entry["sunrise"]
            if entry.get("sunset"):
                daily_data[date_key]["sunset"] = entry["sunset"]
        
        # Create daily forecasts
        daily_forecast = []
        for date_key in sorted(daily_data.keys())[:days]:
            day = daily_data[date_key]
            temps = day["temps"]
            
            if not temps:
                continue
            
            codes = day["codes"]
            most_common_code = max(set(codes), key=codes.count) if codes else 3
            
            daily_forecast.append(DailyForecast(
                date=date_key,
                temperature_max=max(temps) if temps else 0,
                temperature_min=min(temps) if temps else 0,
                weather_code=most_common_code,
                weather_description=WMO_CODES.get(most_common_code, "Unknown"),
                precipitation_probability=max(day["precip_probs"]) if day["precip_probs"] else None,
                precipitation_sum=sum(day["precip_sums"]) if day["precip_sums"] else None,
                wind_speed_max=max(day["wind_speeds"]) if day["wind_speeds"] else None,
                uv_index_max=None,  # Not provided
                sunrise=day["sunrise"],
                sunset=day["sunset"]
            ))
        
        # Astronomy from first day
        astronomy = None
        if daily_forecast and (daily_forecast[0].sunrise or daily_forecast[0].sunset):
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
