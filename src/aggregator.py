"""
AI Weather Aggregator using GPT-5-mini.
Analyzes and summarizes weather data from multiple providers.
"""

import os
import json
from typing import Optional
from openai import AsyncOpenAI
from src.models import (
    WeatherData, AggregatedForecast, Location,
    CurrentWeather, DailyForecast, HourlyForecast, Astronomy
)


class WeatherAggregator:
    """AI-powered weather data aggregator using GPT-5-mini."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the aggregator.
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        self.client = AsyncOpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-5-mini"
    
    async def aggregate(
        self,
        weather_data: list[WeatherData],
        user_language: str = "en"
    ) -> AggregatedForecast:
        """
        Aggregate weather data from multiple providers using AI.
        
        Args:
            weather_data: List of weather data from different providers
            user_language: Language for AI summary (en, cs, etc.)
            
        Returns:
            AggregatedForecast with unified data and AI insights
        """
        if not weather_data:
            raise ValueError("No weather data to aggregate")
        
        # Use first provider's location as reference
        location = weather_data[0].location
        
        # Build context for AI
        context = self._build_ai_context(weather_data)
        
        # Get AI analysis
        summary, confidence = await self._get_ai_analysis(
            context, 
            location.name,
            user_language
        )
        
        # Merge weather data (for now, use first provider as base)
        base_data = weather_data[0]
        
        return AggregatedForecast(
            location=location,
            current=base_data.current,
            daily_forecast=base_data.daily_forecast,
            hourly_forecast=base_data.hourly_forecast,
            astronomy=base_data.astronomy,
            ai_summary=summary,
            confidence_score=confidence,
            sources_used=[wd.provider for wd in weather_data]
        )
    
    def _build_ai_context(self, weather_data: list[WeatherData]) -> str:
        """Build context string for AI from weather data."""
        context_parts = []
        
        for wd in weather_data:
            provider_info = f"\n=== {wd.provider.upper()} ===\n"
            
            if wd.current:
                provider_info += f"""
Current Weather:
- Temperature: {wd.current.temperature}°C (feels like: {wd.current.feels_like}°C)
- Conditions: {wd.current.weather_description}
- Humidity: {wd.current.humidity}%
- Wind: {wd.current.wind_speed} km/h
- Cloud cover: {wd.current.cloud_cover}%
"""
            
            if wd.daily_forecast:
                provider_info += "\nDaily Forecast:\n"
                for day in wd.daily_forecast[:5]:  # Limit to 5 days
                    provider_info += f"- {day.date}: {day.temperature_min}°C to {day.temperature_max}°C, {day.weather_description}\n"
            
            if wd.astronomy:
                provider_info += f"""
Astronomy:
- Sunrise: {wd.astronomy.sunrise}
- Sunset: {wd.astronomy.sunset}
- Moon phase: {wd.astronomy.moon_phase_name or 'N/A'}
"""
            
            context_parts.append(provider_info)
        
        return "\n".join(context_parts)
    
    async def _get_ai_analysis(
        self,
        weather_context: str,
        location_name: str,
        language: str
    ) -> tuple[str, float]:
        """
        Get AI analysis of weather data.
        
        Returns:
            Tuple of (summary text, confidence score 0-1)
        """
        language_instruction = {
            "en": "Respond in English.",
            "cs": "Odpověz v češtině.",
        }.get(language, "Respond in English.")
        
        system_prompt = f"""You are a weather analyst AI. Analyze the provided weather data and create a helpful, concise summary for the user.

{language_instruction}

Guidelines:
- Be conversational and friendly
- Highlight important weather conditions (extreme temps, rain, storms)
- Give practical advice (umbrella, warm clothes, sunscreen, etc.)
- Mention any significant changes in upcoming days
- Keep the summary under 3-4 sentences
- If data from multiple sources differs, note the uncertainty

Also assess data confidence:
- 1.0 = All sources agree perfectly
- 0.8+ = Minor differences, high confidence
- 0.6-0.8 = Some disagreement, moderate confidence
- Below 0.6 = Significant disagreement, low confidence"""

        user_prompt = f"""Location: {location_name}

Weather Data:
{weather_context}

Provide a helpful weather summary and a confidence score (0-1) based on source agreement.
Format your response as JSON:
{{"summary": "your weather summary here", "confidence": 0.95}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("summary", "Weather data unavailable"), result.get("confidence", 0.8)
            
        except Exception as e:
            # Fallback if AI fails
            return f"Weather analysis temporarily unavailable: {str(e)}", 0.5
    
    async def get_ambient_theme(
        self,
        current_weather: CurrentWeather,
        astronomy: Optional[Astronomy],
        current_hour: int
    ) -> dict:
        """
        Determine ambient theme based on weather and time.
        
        Returns:
            Dict with theme name and gradient colors
        """
        # Determine if it's day or night
        is_night = current_hour < 6 or current_hour > 20
        is_sunrise = 5 <= current_hour <= 7
        is_sunset = 18 <= current_hour <= 20
        
        weather_code = current_weather.weather_code or 0
        
        # Storm conditions (codes 95-99)
        if weather_code >= 95:
            return {
                "theme": "storm",
                "gradient": ["#1a0a2e", "#16213e", "#0f0f0f"],
                "effect": "lightning"
            }
        
        # Rain conditions (codes 51-67, 80-82)
        if 51 <= weather_code <= 67 or 80 <= weather_code <= 82:
            return {
                "theme": "rain",
                "gradient": ["#4a6fa5", "#6b8cae", "#8fa8c2"],
                "effect": None
            }
        
        # Snow conditions (codes 71-77, 85-86)
        if 71 <= weather_code <= 77 or 85 <= weather_code <= 86:
            return {
                "theme": "snow",
                "gradient": ["#e8f4f8", "#d4e8ed", "#b8d4e3"],
                "effect": None
            }
        
        # Time-based themes for clear/cloudy weather
        if is_sunrise:
            return {
                "theme": "sunrise",
                "gradient": ["#ff9a9e", "#fecfef", "#ffd89b"],
                "effect": None
            }
        
        if is_sunset:
            return {
                "theme": "sunset",
                "gradient": ["#fa709a", "#fee140", "#642b73"],
                "effect": None
            }
        
        if is_night:
            # Check cloud cover for night theme
            if current_weather.cloud_cover and current_weather.cloud_cover > 50:
                return {
                    "theme": "cloudy_night",
                    "gradient": ["#2c3e50", "#34495e", "#1a1a2e"],
                    "effect": None
                }
            else:
                return {
                    "theme": "clear_night",
                    "gradient": ["#0f0c29", "#302b63", "#24243e"],
                    "effect": "stars"
                }
        
        # Cloudy day (codes 2-3, 45-48)
        if weather_code in [2, 3, 45, 48]:
            return {
                "theme": "cloudy",
                "gradient": ["#8e9eab", "#c5d5e4", "#eef2f3"],
                "effect": None
            }
        
        # Sunny day (default)
        return {
            "theme": "sunny",
            "gradient": ["#f6d365", "#fda085", "#ffecd2"],
            "effect": None
        }
