"""
Base class for weather providers.
"""

from abc import ABC, abstractmethod
from src.models import WeatherData, Location


class WeatherProvider(ABC):
    """Abstract base class for weather data providers."""
    
    name: str = "base"
    
    @abstractmethod
    async def get_weather(self, location: Location, days: int = 7) -> WeatherData:
        """
        Fetch weather data for a location.
        
        Args:
            location: Location to fetch weather for
            days: Number of forecast days (1-16)
            
        Returns:
            WeatherData with current conditions and forecast
        """
        pass
    
    @abstractmethod
    async def search_location(self, query: str) -> list[Location]:
        """
        Search for locations by name.
        
        Args:
            query: Search query (city name, etc.)
            
        Returns:
            List of matching locations
        """
        pass
