"""Weather providers package."""

from src.providers.base import WeatherProvider
from src.providers.open_meteo import OpenMeteoProvider

# Optional providers (require API keys)
try:
    from src.providers.openweathermap import OpenWeatherMapProvider
except ValueError:
    OpenWeatherMapProvider = None  # API key not set

__all__ = ["WeatherProvider", "OpenMeteoProvider", "OpenWeatherMapProvider"]
