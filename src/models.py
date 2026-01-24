"""
Weather data models using Pydantic for type safety.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Location(BaseModel):
    """Location information."""
    name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    timezone: Optional[str] = None


class CurrentWeather(BaseModel):
    """Current weather conditions."""
    temperature: float = Field(description="Temperature in Celsius")
    feels_like: Optional[float] = Field(None, description="Feels like temperature in Celsius")
    humidity: Optional[int] = Field(None, description="Humidity percentage")
    wind_speed: Optional[float] = Field(None, description="Wind speed in km/h")
    wind_direction: Optional[int] = Field(None, description="Wind direction in degrees")
    weather_code: Optional[int] = Field(None, description="WMO weather code")
    weather_description: Optional[str] = Field(None, description="Human-readable weather description")
    uv_index: Optional[float] = None
    visibility: Optional[float] = Field(None, description="Visibility in km")
    pressure: Optional[float] = Field(None, description="Pressure in hPa")
    cloud_cover: Optional[int] = Field(None, description="Cloud cover percentage")


class DailyForecast(BaseModel):
    """Daily forecast data."""
    date: str
    temperature_max: float
    temperature_min: float
    weather_code: Optional[int] = None
    weather_description: Optional[str] = None
    precipitation_probability: Optional[int] = None
    precipitation_sum: Optional[float] = None
    wind_speed_max: Optional[float] = None
    uv_index_max: Optional[float] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None


class HourlyForecast(BaseModel):
    """Hourly forecast data."""
    time: str
    temperature: float
    weather_code: Optional[int] = None
    weather_description: Optional[str] = None
    precipitation_probability: Optional[int] = None
    wind_speed: Optional[float] = None
    humidity: Optional[int] = None


class Astronomy(BaseModel):
    """Astronomical data."""
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    moon_phase: Optional[float] = Field(None, description="Moon phase 0-1 (0=new, 0.5=full)")
    moon_phase_name: Optional[str] = None


class WeatherData(BaseModel):
    """Complete weather data from a provider."""
    provider: str
    location: Location
    current: Optional[CurrentWeather] = None
    daily_forecast: list[DailyForecast] = []
    hourly_forecast: list[HourlyForecast] = []
    astronomy: Optional[Astronomy] = None
    fetched_at: datetime = Field(default_factory=datetime.now)


class AggregatedForecast(BaseModel):
    """AI-aggregated forecast from multiple sources."""
    location: Location
    current: CurrentWeather
    daily_forecast: list[DailyForecast]
    hourly_forecast: list[HourlyForecast]
    astronomy: Optional[Astronomy] = None
    ai_summary: str = Field(description="AI-generated weather summary")
    confidence_score: float = Field(description="Confidence 0-1 based on source agreement")
    sources_used: list[str] = Field(description="List of weather providers used")
