"""
AI Weather Aggregator - Intelligent multi-source data fusion.
Analyzes data from multiple weather APIs and deduces the most accurate forecast.
"""

import os
from typing import Optional
from datetime import datetime
from src.models import (
    WeatherData, AggregatedForecast, Location,
    CurrentWeather, DailyForecast, HourlyForecast, Astronomy
)


class WeatherAggregator:
    """
    AI-powered weather data aggregator.
    
    When multiple sources are available, uses AI to:
    1. Compare temperature, precipitation, wind data from each source
    2. Identify outliers and consensus values
    3. Deduce the most likely actual weather conditions
    4. Assign confidence based on source agreement
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the aggregator.
        
        Args:
            api_key: OpenAI API key (optional - works without for basic aggregation)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.has_ai = bool(self.api_key)
        self.client = None
        
        if self.has_ai:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key)
                self.model = "gpt-5-mini"  # GPT-5 mini for intelligent aggregation
                print(f"[OK] AI aggregation enabled (model: {self.model})")
            except Exception as e:
                print(f"[ERR] AI aggregation failed: {e}")
                self.has_ai = False
        else:
                print("! No OPENAI_API_KEY - using statistical aggregation only")
    
    async def aggregate(
        self,
        weather_data: list[WeatherData],
        user_language: str = "en"
    ) -> AggregatedForecast:
        """
        Aggregate weather data from multiple providers.
        
        With single source: Returns data as-is with basic info
        With multiple sources: Uses AI to deduce most accurate values
        
        Args:
            weather_data: List of weather data from different providers
            user_language: Language for AI summary (en, cs, etc.)
            
        Returns:
            AggregatedForecast with unified data
        """
        if not weather_data:
            raise ValueError("No weather data to aggregate")
        
        location = weather_data[0].location
        sources = [wd.provider for wd in weather_data]
        
        # Single source - just pass through
        if len(weather_data) == 1:
            base = weather_data[0]
            return AggregatedForecast(
                location=location,
                current=base.current,
                daily_forecast=base.daily_forecast,
                hourly_forecast=base.hourly_forecast,
                astronomy=base.astronomy,
                ai_summary=None,  # No AI summary for single source
                confidence_score=0.75,  # Medium confidence with single source
                sources_used=sources
            )
        
        # Multiple sources - perform intelligent aggregation
        if self.has_ai:
            return await self._ai_aggregate(weather_data, user_language)
        else:
            return await self._statistical_aggregate(weather_data)
    
    async def _statistical_aggregate(
        self, 
        weather_data: list[WeatherData]
    ) -> AggregatedForecast:
        """
        Statistical aggregation when AI is not available.
        Uses median values and outlier detection.
        """
        location = weather_data[0].location
        sources = [wd.provider for wd in weather_data]
        
        # Collect current temperatures from all sources
        temps = [wd.current.temperature for wd in weather_data if wd.current]
        feels_likes = [wd.current.feels_like for wd in weather_data if wd.current and wd.current.feels_like]
        humidities = [wd.current.humidity for wd in weather_data if wd.current and wd.current.humidity]
        wind_speeds = [wd.current.wind_speed for wd in weather_data if wd.current and wd.current.wind_speed]
        
        # Use median for robustness against outliers
        def median(values):
            if not values:
                return None
            sorted_v = sorted(values)
            n = len(sorted_v)
            return sorted_v[n // 2] if n % 2 else (sorted_v[n // 2 - 1] + sorted_v[n // 2]) / 2
        
        # Calculate confidence based on source agreement
        def calc_confidence(values):
            if len(values) < 2:
                return 0.75
            spread = max(values) - min(values)
            # Temperature spread < 2°C = high confidence
            if spread < 2:
                return 0.95
            elif spread < 5:
                return 0.85
            else:
                return 0.70
        
        confidence = calc_confidence(temps) if temps else 0.75
        
        # Create aggregated current weather
        base = weather_data[0]
        aggregated_current = CurrentWeather(
            temperature=median(temps) or base.current.temperature,
            feels_like=median(feels_likes),
            humidity=median(humidities),
            wind_speed=median(wind_speeds),
            weather_code=base.current.weather_code,
            weather_description=base.current.weather_description,
            uv_index=base.current.uv_index,
            pressure=base.current.pressure,
            cloud_cover=base.current.cloud_cover,
        )
        
        return AggregatedForecast(
            location=location,
            current=aggregated_current,
            daily_forecast=base.daily_forecast,
            hourly_forecast=base.hourly_forecast,
            astronomy=base.astronomy,
            ai_summary=f"Aggregated from {len(sources)} sources. {'Good' if confidence > 0.85 else 'Moderate'} agreement between providers.",
            confidence_score=confidence,
            sources_used=sources
        )
    
    async def _ai_aggregate(
        self,
        weather_data: list[WeatherData],
        language: str
    ) -> AggregatedForecast:
        """
        AI-powered aggregation using GPT-5-mini.
        Analyzes differences and deduces most accurate values.
        """
        from openai import AsyncOpenAI
        import json
        
        location = weather_data[0].location
        sources = [wd.provider for wd in weather_data]
        
        # Build comparison context
        context_parts = []
        for wd in weather_data:
            if wd.current:
                context_parts.append(f"""
{wd.provider.upper()}:
- Temperature: {wd.current.temperature}°C (feels like: {wd.current.feels_like}°C)
- Humidity: {wd.current.humidity}%
- Wind: {wd.current.wind_speed} km/h
- Conditions: {wd.current.weather_description}
""")
        
        context = "\n".join(context_parts)
        
        language_instruction = {
            "en": "Respond in English.",
            "cs": "Odpověz v češtině.",
        }.get(language, "Respond in English.")
        
        system_prompt = f"""You are an expert meteorologist AI. Analyze weather data from multiple sources and deduce the most accurate forecast.

{language_instruction}

Your task:
1. Compare the values from each source
2. Identify any outliers or inconsistencies
3. Determine the most likely actual values based on:
   - Consensus between sources
   - Known reliability of certain metrics
   - Physical plausibility
4. Provide a confidence score (0-1) based on source agreement

Return a JSON object with:
- "temperature": your deduced temperature in °C
- "feels_like": feels like temperature
- "humidity": humidity percentage
- "wind_speed": wind speed in km/h
- "conditions": weather description
- "confidence": 0-1 score
- "reasoning": brief explanation of your deduction"""

        user_prompt = f"""Location: {location.name}

Data from {len(sources)} weather sources:
{context}

Analyze these sources and deduce the most accurate current weather."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=500,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI model")
            
            result = json.loads(content)
            
            # Create aggregated weather with AI-deduced values
            aggregated_current = CurrentWeather(
                temperature=result.get("temperature", weather_data[0].current.temperature),
                feels_like=result.get("feels_like"),
                humidity=result.get("humidity"),
                wind_speed=result.get("wind_speed"),
                weather_description=result.get("conditions", weather_data[0].current.weather_description),
                weather_code=weather_data[0].current.weather_code,
                uv_index=weather_data[0].current.uv_index,
                pressure=weather_data[0].current.pressure,
                cloud_cover=weather_data[0].current.cloud_cover,
            )
            
            return AggregatedForecast(
                location=location,
                current=aggregated_current,
                daily_forecast=weather_data[0].daily_forecast,
                hourly_forecast=weather_data[0].hourly_forecast,
                astronomy=weather_data[0].astronomy,
                ai_summary=result.get("reasoning", "AI aggregation complete"),
                confidence_score=result.get("confidence", 0.85),
                sources_used=sources
            )
            
        except Exception as e:
            # Fallback to statistical if AI fails
            print(f"[WARN] AI aggregation error: {e}")
            return await self._statistical_aggregate(weather_data)
    
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
