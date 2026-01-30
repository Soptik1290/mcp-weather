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
    
    def _sanitize_prompt_input(self, text: str) -> str:
        """
        Sanitize input text to prevent prompt injection.
        Removes potentially dangerous sequences and limits length.
        """
        if not text:
            return ""
            
        # 1. Truncate to reasonable length (e.g. 200 chars for location)
        sanitized = text[:200]
        
        # 2. Remove sequences that might confuse the model
        # "System:", "User:" might simulate conversation turns
        blacklist = ["System:", "User:", "Assistant:", "'''", '"""']
        for term in blacklist:
            sanitized = sanitized.replace(term, "")
            
        # 3. Strip excessive whitespace
        sanitized = " ".join(sanitized.split())
        
        return sanitized
    
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
        # Import filters
        from src.filters import KalmanFilter1D, EWMA

        location = weather_data[0].location
        sources = [wd.provider for wd in weather_data]
        
        # --- KALMAN FILTER FUSION for Current Weather ---
        # Initialize filters
        kf_temp = KalmanFilter1D(process_variance=0.1, measurement_variance=2.0)
        kf_wind = KalmanFilter1D(process_variance=0.5, measurement_variance=3.0)
        kf_pressure = KalmanFilter1D(process_variance=0.1, measurement_variance=1.0)
        
        # Collect data
        temps = [wd.current.temperature for wd in weather_data if wd.current and wd.current.temperature is not None]
        wind_speeds = [wd.current.wind_speed for wd in weather_data if wd.current and wd.current.wind_speed is not None]
        pressures = [wd.current.pressure for wd in weather_data if wd.current and wd.current.pressure is not None]
        humidities = [wd.current.humidity for wd in weather_data if wd.current and wd.current.humidity is not None]
        
        # Fuse values
        fused_temp = kf_temp.fuse(temps) if temps else weather_data[0].current.temperature
        fused_wind = kf_wind.fuse(wind_speeds) if wind_speeds else weather_data[0].current.wind_speed
        fused_pressure = kf_pressure.fuse(pressures) if pressures else weather_data[0].current.pressure
        
        # Use median for humidity and others (Kalman less critical here)
        def median(values):
            if not values: return None
            sorted_v = sorted(values)
            n = len(sorted_v)
            return sorted_v[n // 2] if n % 2 else (sorted_v[n // 2 - 1] + sorted_v[n // 2]) / 2

        aggregated_current = CurrentWeather(
            temperature=fused_temp,
            feels_like=median([wd.current.feels_like for wd in weather_data if wd.current and wd.current.feels_like]),
            humidity=median(humidities),
            wind_speed=fused_wind,
            weather_code=weather_data[0].current.weather_code,
            weather_description=weather_data[0].current.weather_description,
            uv_index=weather_data[0].current.uv_index,
            pressure=fused_pressure,
            cloud_cover=weather_data[0].current.cloud_cover,
        )
        
        # --- EWMA SMOOTHING for Hourly Forecast ---
        base_hourly = weather_data[0].hourly_forecast
        if base_hourly:
            ewma_temp = EWMA(alpha=0.4) # Moderate smoothing
            temp_curve = [h.temperature for h in base_hourly]
            smoothed_temps = ewma_temp.smooth_array(temp_curve)
            
            # Apply smoothed values back
            for i, h in enumerate(base_hourly):
                h.temperature = smoothed_temps[i]

        return AggregatedForecast(
            location=location,
            current=aggregated_current,
            daily_forecast=weather_data[0].daily_forecast,
            hourly_forecast=base_hourly,
            astronomy=weather_data[0].astronomy,
            ai_summary=f"Aggregated from {len(sources)} sources using Kalman Filter & EWMA smoothing.",
            confidence_score=0.85, # Higher confidence with Kalman
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
        
        # Sanitize input to prevent injection
        safe_location_name = self._sanitize_prompt_input(location.name)
        
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
3. Determine the most likely actual values using Bayesian reasoning (simulate a mental Kalman Filter):
   - Prioritize sources with historically higher reliability
   - Treat each value as a noisy measurement
   - "Fuse" the values to find the most probable true state
4. Provide a confidence score (0-1) based on source convergence

Return a JSON object with:
- "temperature": your deduced temperature in °C
- "feels_like": feels like temperature
- "humidity": humidity percentage
- "wind_speed": wind speed in km/h
- "conditions": weather description
- "confidence": 0-1 score
- "reasoning": brief explanation of your deduction"""

        user_prompt = f"""Location: {safe_location_name}

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
        cloud_cover = current_weather.cloud_cover or 0
        
        # Storm conditions (codes 95-99) - highest priority
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
        
        # Cloudy/overcast conditions (codes 2-3, 45-48) - prioritize over time-based themes
        # Also use cloudy if cloud cover is high
        if weather_code in [2, 3, 45, 48] or cloud_cover >= 70:
            if is_night:
                return {
                    "theme": "cloudy_night",
                    "gradient": ["#2c3e50", "#34495e", "#1a1a2e"],
                    "effect": None
                }
            else:
                return {
                    "theme": "cloudy",
                    "gradient": ["#8e9eab", "#c5d5e4", "#eef2f3"],
                    "effect": None
                }
        
        # Time-based themes ONLY for clear/fair weather (codes 0-1)
        if is_sunrise and weather_code <= 1:
            return {
                "theme": "sunrise",
                "gradient": ["#ff9a9e", "#fecfef", "#ffd89b"],
                "effect": None
            }
        
        if is_sunset and weather_code <= 1:
            return {
                "theme": "sunset",
                "gradient": ["#fa709a", "#fee140", "#642b73"],
                "effect": None
            }
        
        if is_night:
            if cloud_cover > 50:
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
        
        # Sunny day (default for clear weather codes 0-1)
        return {
            "theme": "sunny",
            "gradient": ["#f6d365", "#fda085", "#ffecd2"],
            "effect": None
        }
