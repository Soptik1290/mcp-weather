"""
MET Norway (Yr.no) weather provider.
Free, no API key required. Global weather data.
https://api.met.no/weatherapi/locationforecast/2.0/documentation
"""

import httpx
from datetime import datetime
from typing import Optional
from src.providers.base import WeatherProvider
from src.models import (
    WeatherData, Location, CurrentWeather, 
    DailyForecast, HourlyForecast, Astronomy
)


# MET Norway symbol codes to WMO-like codes mapping
# https://api.met.no/weatherapi/weathericon/2.0/documentation
SYMBOL_TO_WMO = {
    "clearsky": 0,
    "fair": 1,
    "partlycloudy": 2,
    "cloudy": 3,
    "fog": 45,
    "lightrain": 61,
    "rain": 63,
    "heavyrain": 65,
    "lightrainshowers": 80,
    "rainshowers": 81,
    "heavyrainshowers": 82,
    "lightsnow": 71,
    "snow": 73,
    "heavysnow": 75,
    "lightsnowshowers": 85,
    "snowshowers": 85,
    "heavysnowshowers": 86,
    "lightsleet": 66,
    "sleet": 66,
    "heavysleet": 67,
    "lightsleetshowers": 66,
    "sleetshowers": 67,
    "heavysleetshowers": 67,
    "thunder": 95,
    "rainandthunder": 95,
    "heavyrainandthunder": 95,
    "lightrainandthunder": 95,
    "snowandthunder": 95,
    "lightrainshowersandthunder": 96,
    "rainshowersandthunder": 96,
    "heavyrainshowersandthunder": 96,
}

# WMO descriptions
WMO_CODES = {
    0: {"en": "Clear sky", "cs": "Jasno"},
    1: {"en": "Mainly clear", "cs": "Skoro jasno"},
    2: {"en": "Partly cloudy", "cs": "Polojasno"},
    3: {"en": "Overcast", "cs": "Zataženo"},
    45: {"en": "Foggy", "cs": "Mlha"},
    48: {"en": "Depositing rime fog", "cs": "Mrznoucí mlha"},
    51: {"en": "Light drizzle", "cs": "Slabé mrholení"},
    53: {"en": "Moderate drizzle", "cs": "Mírné mrholení"},
    55: {"en": "Dense drizzle", "cs": "Husté mrholení"},
    56: {"en": "Light freezing drizzle", "cs": "Slabé mrznoucí mrholení"},
    57: {"en": "Dense freezing drizzle", "cs": "Husté mrznoucí mrholení"},
    61: {"en": "Slight rain", "cs": "Slabý déšť"},
    63: {"en": "Moderate rain", "cs": "Mírný déšť"},
    65: {"en": "Heavy rain", "cs": "Silný déšť"},
    66: {"en": "Light freezing rain", "cs": "Slabý mrznoucí déšť"},
    67: {"en": "Heavy freezing rain", "cs": "Silný mrznoucí déšť"},
    71: {"en": "Slight snow", "cs": "Slabé sněžení"},
    73: {"en": "Moderate snow", "cs": "Mírné sněžení"},
    75: {"en": "Heavy snow", "cs": "Silné sněžení"},
    77: {"en": "Snow grains", "cs": "Sněhová zrna"},
    80: {"en": "Slight rain showers", "cs": "Slabé přeháňky"},
    81: {"en": "Moderate rain showers", "cs": "Mírné přeháňky"},
    82: {"en": "Violent rain showers", "cs": "Silné přeháňky"},
    85: {"en": "Slight snow showers", "cs": "Slabé sněhové přeháňky"},
    86: {"en": "Heavy snow showers", "cs": "Silné sněhové přeháňky"},
    95: {"en": "Thunderstorm", "cs": "Bouřka"},
    96: {"en": "Thunderstorm with slight hail", "cs": "Bouřka s kroupami"},
    99: {"en": "Thunderstorm with heavy hail", "cs": "Silná bouřka s kroupami"},
}


def symbol_to_wmo(symbol_code: str) -> int:
    """Convert MET Norway symbol code to WMO code."""
    # Remove _day/_night suffix
    base_symbol = symbol_code.split("_")[0].lower()
    return SYMBOL_TO_WMO.get(base_symbol, 0)


class METNorwayProvider(WeatherProvider):
    """MET Norway (Yr.no) weather provider - free, no API key required."""
    
    name = "met_norway"
    BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0"
    USER_AGENT = "mcp-weather/1.0 github.com/Soptik1290/mcp-weather"
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": self.USER_AGENT}
        )
    
    async def search_location(self, query: str) -> list[Location]:
        """Search not supported - use Open-Meteo geocoding instead."""
        return []
    
    async def get_weather(self, location: Location, days: int = 7, language: str = "en") -> WeatherData:
        """Fetch weather data from MET Norway API."""
        
        # Round coordinates to 4 decimal places as recommended
        lat = round(location.latitude, 4)
        lon = round(location.longitude, 4)
        
        response = await self.client.get(
            f"{self.BASE_URL}/compact",
            params={"lat": lat, "lon": lon}
        )
        response.raise_for_status()
        data = response.json()
        
        properties = data.get("properties", {})
        timeseries = properties.get("timeseries", [])
        
        if not timeseries:
            raise ValueError("No forecast data received from MET Norway")
        
        # Parse current weather (first entry)
        current_entry = timeseries[0]
        current_instant = current_entry.get("data", {}).get("instant", {}).get("details", {})
        current_next_1h = current_entry.get("data", {}).get("next_1_hours", {})
        
        symbol_code = current_next_1h.get("summary", {}).get("symbol_code", "clearsky_day")
        weather_code = symbol_to_wmo(symbol_code)
        
        current = CurrentWeather(
            temperature=current_instant.get("air_temperature", 0),
            feels_like=None,  # Not provided by MET Norway
            humidity=current_instant.get("relative_humidity"),
            wind_speed=current_instant.get("wind_speed") * 3.6 if current_instant.get("wind_speed") else None,  # m/s to km/h
            wind_direction=current_instant.get("wind_from_direction"),
            weather_code=weather_code,
            weather_description=WMO_CODES.get(weather_code, {}).get(language, "Unknown"),
            pressure=current_instant.get("air_pressure_at_sea_level"),
            cloud_cover=current_instant.get("cloud_area_fraction")
        )
        
        # Parse hourly forecast (next 24 hours)
        hourly_forecast = []
        for entry in timeseries[:24]:
            time_str = entry.get("time", "")
            instant = entry.get("data", {}).get("instant", {}).get("details", {})
            next_1h = entry.get("data", {}).get("next_1_hours", {})
            
            symbol = next_1h.get("summary", {}).get("symbol_code", "clearsky_day")
            code = symbol_to_wmo(symbol)
            
            # Parse ISO timestamp
            try:
                dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                formatted_time = dt.strftime("%Y-%m-%dT%H:00")
            except:
                formatted_time = time_str
            
            hourly_forecast.append(HourlyForecast(
                time=formatted_time,
                temperature=instant.get("air_temperature", 0),
                weather_code=code,
                weather_description=WMO_CODES.get(code, {}).get(language, "Unknown"),
                precipitation_probability=next_1h.get("details", {}).get("probability_of_precipitation"),
                wind_speed=instant.get("wind_speed") * 3.6 if instant.get("wind_speed") else None,
                humidity=instant.get("relative_humidity")
            ))
        
        # Parse daily forecast (aggregate from hourly data)
        daily_forecast = []
        daily_data = {}
        
        for entry in timeseries:
            time_str = entry.get("time", "")
            try:
                dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                date_key = dt.strftime("%Y-%m-%d")
            except:
                continue
            
            if date_key not in daily_data:
                daily_data[date_key] = {
                    "temps": [],
                    "precip_probs": [],
                    "wind_speeds": [],
                    "codes": []
                }
            
            instant = entry.get("data", {}).get("instant", {}).get("details", {})
            next_1h = entry.get("data", {}).get("next_1_hours", {})
            next_6h = entry.get("data", {}).get("next_6_hours", {})
            
            if instant.get("air_temperature") is not None:
                daily_data[date_key]["temps"].append(instant["air_temperature"])
            
            prob = next_1h.get("details", {}).get("probability_of_precipitation") or \
                   next_6h.get("details", {}).get("probability_of_precipitation")
            if prob is not None:
                daily_data[date_key]["precip_probs"].append(prob)
            
            if instant.get("wind_speed") is not None:
                daily_data[date_key]["wind_speeds"].append(instant["wind_speed"] * 3.6)
            
            symbol = next_1h.get("summary", {}).get("symbol_code") or \
                     next_6h.get("summary", {}).get("symbol_code")
            if symbol:
                daily_data[date_key]["codes"].append(symbol_to_wmo(symbol))
        
        # Create daily forecasts from aggregated data
        for date_key in sorted(daily_data.keys())[:days]:
            day = daily_data[date_key]
            temps = day["temps"]
            
            if not temps:
                continue
            
            # Get most common weather code
            codes = day["codes"]
            most_common_code = max(set(codes), key=codes.count) if codes else 0
            
            daily_forecast.append(DailyForecast(
                date=date_key,
                temperature_max=max(temps) if temps else 0,
                temperature_min=min(temps) if temps else 0,
                weather_code=most_common_code,
                weather_description=WMO_CODES.get(most_common_code, {}).get(language, "Unknown"),
                precipitation_probability=max(day["precip_probs"]) if day["precip_probs"] else None,
                precipitation_sum=None,  # Not directly provided
                wind_speed_max=max(day["wind_speeds"]) if day["wind_speeds"] else None,
                uv_index_max=None  # Not provided by compact endpoint
            ))
        
        return WeatherData(
            provider=self.name,
            location=location,
            current=current,
            daily_forecast=daily_forecast,
            hourly_forecast=hourly_forecast,
            astronomy=None  # Not provided by Locationforecast
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
