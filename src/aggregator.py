"""
AI Weather Aggregator - Intelligent multi-source data fusion.
Analyzes data from multiple weather APIs and deduces the most accurate forecast.
"""

import os
import statistics
from typing import Optional
from datetime import datetime
from src.models import (
    WeatherData, AggregatedForecast, Location,
    CurrentWeather, DailyForecast, HourlyForecast, Astronomy
)
from src.astro_calc import get_astronomy_data
from src.filters import KalmanFilter1D
import json


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
                self.model = "gpt-5.4-nano"  # GPT-5.4 nano — faster, cost-efficient, similar intelligence
                print(f"[OK] AI aggregation enabled (model: {self.model})")
            except Exception as e:
                print(f"[ERR] AI aggregation failed: {e}")
                self.has_ai = False
        else:
                print("! No OPENAI_API_KEY - using statistical aggregation only")

    # ── Multi-source forecast aggregation ─────────────────────────────

    def _iqr_filter(self, values: list[float]) -> list[float]:
        """Remove outliers using IQR method. Returns filtered list."""
        if len(values) < 3:
            return values
        sorted_v = sorted(values)
        q1 = sorted_v[len(sorted_v) // 4]
        q3 = sorted_v[3 * len(sorted_v) // 4]
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        return [v for v in values if lower <= v <= upper]

    def _kalman_fuse(self, values: list[float]) -> float:
        """Fuse multiple measurements using Kalman filter."""
        if not values:
            return 0.0
        kf = KalmanFilter1D(process_variance=1e-4, measurement_variance=1.0)
        return kf.fuse(values)

    def _aggregate_forecasts(
        self,
        weather_data: list[WeatherData]
    ) -> tuple[list[DailyForecast], list[HourlyForecast]]:
        """
        Aggregate daily and hourly forecasts from ALL providers using
        Kalman fusion for temperatures, weighted average for precipitation,
        and IQR outlier filtering for wind.
        """
        if len(weather_data) <= 1:
            return (
                weather_data[0].daily_forecast if weather_data else [],
                weather_data[0].hourly_forecast if weather_data else []
            )

        # ── Daily Forecast Aggregation ──
        # Group by date
        daily_by_date: dict[str, list[DailyForecast]] = {}
        for w in weather_data:
            for d in w.daily_forecast:
                daily_by_date.setdefault(d.date, []).append(d)

        aggregated_daily: list[DailyForecast] = []
        for date_str in sorted(daily_by_date.keys()):
            entries = daily_by_date[date_str]
            if len(entries) == 1:
                aggregated_daily.append(entries[0])
                continue

            # Collect values
            max_temps = [e.temperature_max for e in entries if e.temperature_max is not None]
            min_temps = [e.temperature_min for e in entries if e.temperature_min is not None]
            precip_probs = [e.precipitation_probability for e in entries if e.precipitation_probability is not None]
            precip_sums = [e.precipitation_sum for e in entries if e.precipitation_sum is not None]
            wind_maxes = [e.wind_speed_max for e in entries if e.wind_speed_max is not None]
            uv_maxes = [e.uv_index_max for e in entries if e.uv_index_max is not None]

            # Wind: IQR filter then median
            filtered_wind = self._iqr_filter(wind_maxes) if wind_maxes else []

            aggregated_daily.append(DailyForecast(
                date=date_str,
                temperature_max=round(self._kalman_fuse(max_temps), 1) if max_temps else entries[0].temperature_max,
                temperature_min=round(self._kalman_fuse(min_temps), 1) if min_temps else entries[0].temperature_min,
                weather_code=entries[0].weather_code,
                weather_description=entries[0].weather_description,
                precipitation_probability=round(statistics.mean(precip_probs)) if precip_probs else entries[0].precipitation_probability,
                precipitation_sum=round(statistics.median(precip_sums), 1) if precip_sums else entries[0].precipitation_sum,
                snowfall_sum=entries[0].snowfall_sum,
                wind_speed_max=round(statistics.median(filtered_wind), 1) if filtered_wind else entries[0].wind_speed_max,
                uv_index_max=round(statistics.mean(uv_maxes), 1) if uv_maxes else entries[0].uv_index_max,
                sunrise=entries[0].sunrise,
                sunset=entries[0].sunset,
            ))

        # ── Hourly Forecast Aggregation ──
        hourly_by_time: dict[str, list[HourlyForecast]] = {}
        for w in weather_data:
            for h in w.hourly_forecast:
                # Normalize time strings to YYYY-MM-DDTHH:MM (16 chars)
                # This prevents duplicate hour entries when providers format times differently (e.g. 17:00 vs 17:00:00)
                normalized_time = h.time[:16]
                hourly_by_time.setdefault(normalized_time, []).append(h)

        aggregated_hourly: list[HourlyForecast] = []
        for time_str in sorted(hourly_by_time.keys()):
            entries = hourly_by_time[time_str]
            if len(entries) == 1:
                aggregated_hourly.append(entries[0])
                continue

            temps = [e.temperature for e in entries if e.temperature is not None]
            precip_probs = [e.precipitation_probability for e in entries if e.precipitation_probability is not None]
            winds = [e.wind_speed for e in entries if e.wind_speed is not None]
            humidities = [e.humidity for e in entries if e.humidity is not None]
            pressures = [e.pressure for e in entries if e.pressure is not None]
            precip_amounts = [e.precipitation_amount for e in entries if e.precipitation_amount is not None]

            # Wind: IQR filter then median
            filtered_wind = self._iqr_filter(winds) if winds else []

            aggregated_hourly.append(HourlyForecast(
                time=time_str,
                temperature=round(self._kalman_fuse(temps), 1) if temps else entries[0].temperature,
                weather_code=entries[0].weather_code,
                weather_description=entries[0].weather_description,
                precipitation_probability=round(statistics.mean(precip_probs)) if precip_probs else entries[0].precipitation_probability,
                wind_speed=round(statistics.median(filtered_wind), 1) if filtered_wind else entries[0].wind_speed,
                humidity=round(statistics.mean(humidities)) if humidities else entries[0].humidity,
                pressure=round(statistics.mean(pressures)) if pressures else entries[0].pressure,
                precipitation_amount=round(statistics.mean(precip_amounts), 1) if precip_amounts else entries[0].precipitation_amount,
            ))

        return aggregated_daily, aggregated_hourly

    def _composite_feels_like(self, weather_data: list[WeatherData]) -> Optional[float]:
        """Fuse feels_like temperature from multiple sources using Kalman filter."""
        feels = [w.current.feels_like for w in weather_data if w.current and w.current.feels_like is not None]
        if not feels:
            return None
        if len(feels) == 1:
            return feels[0]
        return round(self._kalman_fuse(feels), 1)

    def _compute_model_agreement(
        self,
        weather_data: list[WeatherData],
        language: str = "en"
    ) -> dict:
        """
        Compute per-field model agreement and generate divergence alerts.
        """
        if len(weather_data) <= 1:
            return {"overall": "high"}

        result = {}

        # Temperature spread
        temps = [w.current.temperature for w in weather_data if w.current and w.current.temperature is not None]
        if len(temps) >= 2:
            spread = max(temps) - min(temps)
            agreement = "high" if spread < 3 else ("moderate" if spread < 6 else "low")
            result["temperature"] = {"spread": round(spread, 1), "agreement": agreement}

        # Precipitation spread (probability)
        precips = []
        for w in weather_data:
            if w.daily_forecast and w.daily_forecast[0].precipitation_probability is not None:
                precips.append(w.daily_forecast[0].precipitation_probability)
        if len(precips) >= 2:
            spread = max(precips) - min(precips)
            agreement = "high" if spread < 20 else ("moderate" if spread < 40 else "low")
            result["precipitation"] = {"spread": round(spread, 1), "agreement": agreement}

        # Wind spread + outlier info
        winds = [w.current.wind_speed for w in weather_data if w.current and w.current.wind_speed is not None]
        if len(winds) >= 2:
            spread = max(winds) - min(winds)
            agreement = "high" if spread < 10 else ("moderate" if spread < 20 else "low")
            wind_info = {"spread": round(spread, 1), "agreement": agreement}
            # Check for outlier
            filtered = self._iqr_filter(winds)
            if len(filtered) < len(winds):
                outlier_providers = []
                for w in weather_data:
                    if w.current and w.current.wind_speed is not None and w.current.wind_speed not in filtered:
                        outlier_providers.append(w.provider)
                if outlier_providers:
                    wind_info["outlier_removed"] = ", ".join(outlier_providers)
            result["wind"] = wind_info

        # Overall agreement
        agreements = [v.get("agreement", "high") for v in result.values()]
        if "low" in agreements:
            overall = "low"
        elif agreements.count("moderate") >= 2:
            overall = "moderate"
        elif "moderate" in agreements:
            overall = "moderate"
        else:
            overall = "high"
        result["overall"] = overall

        # Alert text
        if overall == "low":
            # Find which field diverges most
            low_fields = [k for k, v in result.items() if isinstance(v, dict) and v.get("agreement") == "low"]
            
            field_translations = {
                "temperature": "teploty" if language == "cs" else "temperature",
                "precipitation": "srážek" if language == "cs" else "precipitation",
                "wind": "větru" if language == "cs" else "wind",
                "cloud_cover": "oblačnosti" if language == "cs" else "cloud cover",
            }
            translated_fields = [field_translations.get(f, f) for f in low_fields]
            fields_str = ", ".join(translated_fields)

            if language == "cs":
                result["alert"] = f"⚠️ Modely se rozcházejí u: {fields_str} — sledujte aktualizace"
            else:
                result["alert"] = f"⚠️ Models diverge on: {fields_str} — check for updates"

        return result
    
    async def aggregate(
        self,
        weather_data: list[WeatherData],
        user_language: str = "en",
        model: str = "gpt-5.4-nano",
        confidence_bias: str = "balanced"
    ) -> AggregatedForecast:
        """
        Aggregate weather data from multiple providers.
        """
        if not weather_data:
            raise ValueError("No weather data provided for aggregation")

        # Multiple sources - perform intelligent aggregation
        if self.has_ai:
            return await self._ai_aggregate(weather_data, user_language, model, confidence_bias)
        else:
            return await self._statistical_aggregate(weather_data, user_language)

    async def _ai_aggregate(
        self,
        weather_data: list[WeatherData],
        language: str,
        model: str = "gpt-5.4-nano",
        confidence_bias: str = "balanced"
    ) -> AggregatedForecast:
        print(f"DEBUG: _ai_aggregate called with language='{language}', model='{model}', confidence_bias='{confidence_bias}'")
        # ...
        
        # Prepare context for AI — include precipitation, pressure, UV, visibility
        sources = [w.provider for w in weather_data]
        location = weather_data[0].location
        safe_location_name = self._sanitize_prompt_input(location.name)
        
        context_parts = []
        for w in weather_data:
            if w.current:
                context_parts.append(f"Source: {w.provider}")
                context_parts.append(f"Temperature: {w.current.temperature}°C")
                if w.current.feels_like is not None:
                    context_parts.append(f"Feels like: {w.current.feels_like}°C")
                context_parts.append(f"Conditions: {w.current.weather_description}")
                context_parts.append(f"Wind: {w.current.wind_speed} km/h")
                context_parts.append(f"Humidity: {w.current.humidity}%")
                if w.current.pressure is not None:
                    context_parts.append(f"Pressure: {w.current.pressure} hPa")
                if w.current.uv_index is not None:
                    context_parts.append(f"UV Index: {w.current.uv_index}")
                if w.current.visibility is not None:
                    context_parts.append(f"Visibility: {w.current.visibility} m")
            # Add today's precipitation from daily forecast
            if w.daily_forecast:
                d0 = w.daily_forecast[0]
                if d0.precipitation_probability is not None:
                    context_parts.append(f"Precip probability today: {d0.precipitation_probability}%")
                if d0.precipitation_sum is not None:
                    context_parts.append(f"Precip sum today: {d0.precipitation_sum} mm")
            context_parts.append("---")
        
        if not context_parts:
            raise ValueError("No valid weather data available from any provider")
        
        context = "\n".join(context_parts)
        
        bias_instruction = {
            "cautious": "ADOPT A CAUTIOUS BIAS: 'Warn me'. If sources disagree, lean towards worse conditions (rain, wind, extreme temps) to ensure user safety.",
            "optimistic": "ADOPT AN OPTIMISTIC BIAS: 'Be optimistic'. If sources disagree, lean towards better conditions (sun, mild temps), but do not ignore dangerous warnings.",
            "balanced": "ADOPT A BALANCED BIAS. Weigh sources equally and aim for the most statistically probable outcome."
        }.get(confidence_bias, "ADOPT A BALANCED BIAS.")

        language_instruction = f"The 'conditions' field MUST be strictly in the '{language.upper()}' language code (e.g. 'EN' for English, 'CS' for Czech). All other JSON keys must remain in English."

        system_prompt = f"""You are a weather data analyst. Deduce the most accurate weather values from multiple sources.

{language_instruction}
{bias_instruction}

Your task:
1. Analyze the weather data to determine the most likely actual conditions.
2. Deduce the most accurate numerical values (temperature, wind, etc.) based on the consensus of sources.
3. The "conditions" field should be a short weather description (e.g., "Cloudy", "Light rain").

Return a JSON object with:
- "temperature": your deduced temperature in °C
- "feels_like": feels like temperature (consider wind chill and humidity from all sources)
- "humidity": humidity percentage
- "wind_speed": wind speed in km/h (ignore obvious outliers)
- "pressure": pressure in hPa (if available from sources)
- "uv_index": UV index (if available)
- "conditions": weather description (in target language)
- "precipitation_confidence": 0-100 how confident you are about precipitation today
- "confidence": 0-1 score"""

        user_prompt = f"""Location: {safe_location_name}

Data from {len(sources)} weather sources:
{context}

Analyze these sources and deduce the most accurate current weather."""

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI model")
            
            result = json.loads(content)

            # Get base current weather (handle None case)
            base_current = weather_data[0].current

            # Composite feels_like from all sources via Kalman fusion
            composite_fl = self._composite_feels_like(weather_data)

            # Create aggregated weather with AI-deduced values
            aggregated_current = CurrentWeather(
                temperature=result.get("temperature", base_current.temperature if base_current else 0),
                feels_like=result.get("feels_like", composite_fl),
                humidity=result.get("humidity"),
                wind_speed=result.get("wind_speed"),
                weather_description=result.get("conditions", base_current.weather_description if base_current else "Unknown"),
                weather_code=base_current.weather_code if base_current else None,
                uv_index=result.get("uv_index", base_current.uv_index if base_current else None),
                pressure=result.get("pressure", base_current.pressure if base_current else None),
                cloud_cover=base_current.cloud_cover if base_current else None,
            )

            # Aggregate daily/hourly from ALL providers (not just first)
            agg_daily, agg_hourly = self._aggregate_forecasts(weather_data)

            # Compute model agreement
            agreement = self._compute_model_agreement(weather_data, language)

            # Calculate complete astronomy data using ephem (same as _statistical_aggregate)
            astro_data = get_astronomy_data(location.latitude, location.longitude)
            base_astro = weather_data[0].astronomy
            if base_astro:
                astronomy = Astronomy(
                    sunrise=base_astro.sunrise or astro_data.get("sunrise"),
                    sunset=base_astro.sunset or astro_data.get("sunset"),
                    moonrise=astro_data.get("moonrise"),
                    moonset=astro_data.get("moonset"),
                    moon_phase=astro_data.get("moon_phase"),
                    moon_phase_name=base_astro.moon_phase_name,
                    moon_illumination=astro_data.get("moon_illumination"),
                    daylight_duration=astro_data.get("daylight_duration"),
                    moon_distance=astro_data.get("moon_distance"),
                    next_full_moon=astro_data.get("next_full_moon")
                )
            else:
                astronomy = Astronomy(
                    sunrise=astro_data.get("sunrise"),
                    sunset=astro_data.get("sunset"),
                    moonrise=astro_data.get("moonrise"),
                    moonset=astro_data.get("moonset"),
                    moon_phase=astro_data.get("moon_phase"),
                    moon_illumination=astro_data.get("moon_illumination"),
                    daylight_duration=astro_data.get("daylight_duration"),
                    moon_distance=astro_data.get("moon_distance"),
                    next_full_moon=astro_data.get("next_full_moon")
                )

            return AggregatedForecast(
                location=location,
                current=aggregated_current,
                daily_forecast=agg_daily,
                hourly_forecast=agg_hourly,
                astronomy=astronomy,
                ai_summary=None,  # Summary loaded lazily via /weather/ai-summary
                confidence_score=result.get("confidence", 0.85),
                sources_used=sources,
                model_agreement=agreement
            )
            
        except Exception as e:
            # First failure with primary model
            print(f"[WARN] AI aggregation error (primary {model}): {e}")
            
            # Fallback to gpt-5-mini if primary was gpt-5.4-nano
            if model == "gpt-5.4-nano":
                try:
                    print("[INFO] Retrying with gpt-5-mini...")
                    response = await self.client.chat.completions.create(
                        model="gpt-5-mini",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        max_completion_tokens=2000,
                        response_format={"type": "json_object"}
                    )
                    
                    content = response.choices[0].message.content
                    if not content:
                        raise ValueError("Empty response from backup model")
                    
                    result = json.loads(content)
                    
                    # Composite feels_like from all sources
                    composite_fl = self._composite_feels_like(weather_data)

                    # Create aggregated weather with AI-deduced values
                    aggregated_current = CurrentWeather(
                        temperature=result.get("temperature", weather_data[0].current.temperature),
                        feels_like=result.get("feels_like", composite_fl),
                        humidity=result.get("humidity"),
                        wind_speed=result.get("wind_speed"),
                        weather_description=result.get("conditions", weather_data[0].current.weather_description),
                        weather_code=weather_data[0].current.weather_code,
                        uv_index=result.get("uv_index", weather_data[0].current.uv_index),
                        pressure=result.get("pressure", weather_data[0].current.pressure),
                        cloud_cover=weather_data[0].current.cloud_cover,
                    )

                    agg_daily, agg_hourly = self._aggregate_forecasts(weather_data)
                    agreement = self._compute_model_agreement(weather_data, language)

                    # Calculate complete astronomy data using ephem
                    astro_data_backup = get_astronomy_data(location.latitude, location.longitude)
                    base_astro_backup = weather_data[0].astronomy
                    if base_astro_backup:
                        astronomy_backup = Astronomy(
                            sunrise=base_astro_backup.sunrise or astro_data_backup.get("sunrise"),
                            sunset=base_astro_backup.sunset or astro_data_backup.get("sunset"),
                            moonrise=astro_data_backup.get("moonrise"),
                            moonset=astro_data_backup.get("moonset"),
                            moon_phase=astro_data_backup.get("moon_phase"),
                            moon_phase_name=base_astro_backup.moon_phase_name,
                            moon_illumination=astro_data_backup.get("moon_illumination"),
                            daylight_duration=astro_data_backup.get("daylight_duration"),
                            moon_distance=astro_data_backup.get("moon_distance"),
                            next_full_moon=astro_data_backup.get("next_full_moon")
                        )
                    else:
                        astronomy_backup = Astronomy(
                            sunrise=astro_data_backup.get("sunrise"),
                            sunset=astro_data_backup.get("sunset"),
                            moonrise=astro_data_backup.get("moonrise"),
                            moonset=astro_data_backup.get("moonset"),
                            moon_phase=astro_data_backup.get("moon_phase"),
                            moon_illumination=astro_data_backup.get("moon_illumination"),
                            daylight_duration=astro_data_backup.get("daylight_duration"),
                            moon_distance=astro_data_backup.get("moon_distance"),
                            next_full_moon=astro_data_backup.get("next_full_moon")
                        )

                    return AggregatedForecast(
                        location=location,
                        current=aggregated_current,
                        daily_forecast=agg_daily,
                        hourly_forecast=agg_hourly,
                        astronomy=astronomy_backup,
                        ai_summary=None,  # Summary loaded lazily via /weather/ai-summary
                        confidence_score=result.get("confidence", 0.80),
                        sources_used=sources,
                        model_agreement=agreement
                    )
                except Exception as e2:
                    print(f"[ERR] Backup AI model (gpt-5-mini) failed: {e2}")
                    # Convert error to string for display
                    error_msg = str(e2)
                    if "429" in error_msg:
                        friendly_error = "AI Overload (429)"
                    elif "length" in error_msg:
                        friendly_error = "AI Context Limit"
                    else:
                        friendly_error = f"AI Error: {type(e2).__name__}"
                    
                    return await self._statistical_aggregate(weather_data, language, availability_message=f"Statistický souhrn ({friendly_error})")

            # If not gpt-5-mini or fallback failed (though backup failure is handled above)
            error_msg = f"AI Error: {type(e).__name__}"
            return await self._statistical_aggregate(weather_data, language, availability_message=f"Statistický souhrn ({error_msg})")
    
    async def _statistical_aggregate(
        self,
        weather_data: list[WeatherData],
        language: str = "en",
        availability_message: Optional[str] = None
    ) -> AggregatedForecast:
        """
        Fallback aggregation method using statistical averages.
        """
        if not weather_data:
            raise ValueError("No weather data to aggregate")
            
        # Initialize sums
        temp_sum = 0
        wind_sum = 0
        humidity_sum = 0
        pressure_sum = 0
        valid_temps = 0
        valid_winds = 0
        valid_humidity = 0
        valid_pressure = 0
        
        # Calculate averages
        for w in weather_data:
            if w.current.temperature is not None:
                temp_sum += w.current.temperature
                valid_temps += 1
            if w.current.wind_speed is not None:
                wind_sum += w.current.wind_speed
                valid_winds += 1
            if w.current.humidity is not None:
                humidity_sum += w.current.humidity
                valid_humidity += 1
            if w.current.pressure is not None:
                pressure_sum += w.current.pressure
                valid_pressure += 1
                
        # Composite feels_like via Kalman fusion
        composite_fl = self._composite_feels_like(weather_data)

        # Wind: use IQR-filtered median instead of simple average
        wind_values = [w.current.wind_speed for w in weather_data if w.current and w.current.wind_speed is not None]
        filtered_winds = self._iqr_filter(wind_values) if wind_values else []
        avg_wind = round(statistics.median(filtered_winds), 1) if filtered_winds else (round(wind_sum / valid_winds, 1) if valid_winds > 0 else None)

        # Temperature: Kalman fusion
        temp_values = [w.current.temperature for w in weather_data if w.current and w.current.temperature is not None]
        avg_temp = round(self._kalman_fuse(temp_values), 1) if temp_values else (round(temp_sum / valid_temps, 1) if valid_temps > 0 else None)

        # Create averaged current weather
        avg_current = CurrentWeather(
            temperature=avg_temp,
            wind_speed=avg_wind,
            humidity=round(humidity_sum / valid_humidity) if valid_humidity > 0 else None,
            pressure=round(pressure_sum / valid_pressure) if valid_pressure > 0 else None,
            weather_code=weather_data[0].current.weather_code, # Use primary source
            weather_description=weather_data[0].current.weather_description,
            uv_index=weather_data[0].current.uv_index,
            cloud_cover=weather_data[0].current.cloud_cover,
            feels_like=composite_fl
        )
        
        sources = [w.provider for w in weather_data]

        # Aggregate daily/hourly from ALL providers
        agg_daily, agg_hourly = self._aggregate_forecasts(weather_data)

        # Model agreement
        agreement = self._compute_model_agreement(weather_data, language)

        # Calculate complete astronomy data using ephem
        location = weather_data[0].location
        astro_data = get_astronomy_data(location.latitude, location.longitude)

        # Merge with existing astronomy data if available
        base_astro = weather_data[0].astronomy
        if base_astro:
            astronomy = Astronomy(
                sunrise=base_astro.sunrise or astro_data.get("sunrise"),
                sunset=base_astro.sunset or astro_data.get("sunset"),
                moonrise=astro_data.get("moonrise"),
                moonset=astro_data.get("moonset"),
                moon_phase=astro_data.get("moon_phase"),
                moon_phase_name=base_astro.moon_phase_name,
                moon_illumination=astro_data.get("moon_illumination"),
                daylight_duration=astro_data.get("daylight_duration"),
                moon_distance=astro_data.get("moon_distance"),
                next_full_moon=astro_data.get("next_full_moon")
            )
        else:
            astronomy = Astronomy(
                sunrise=astro_data.get("sunrise"),
                sunset=astro_data.get("sunset"),
                moonrise=astro_data.get("moonrise"),
                moonset=astro_data.get("moonset"),
                moon_phase=astro_data.get("moon_phase"),
                moon_illumination=astro_data.get("moon_illumination"),
                daylight_duration=astro_data.get("daylight_duration"),
                moon_distance=astro_data.get("moon_distance"),
                next_full_moon=astro_data.get("next_full_moon")
            )

        fallback_msg = availability_message
        if not fallback_msg:
             fallback_msg = "Statistický souhrn (AI nedostupné)" if language == "cs" else "Statistical aggregation (AI unavailable)"

        return AggregatedForecast(
            location=weather_data[0].location,
            current=avg_current,
            daily_forecast=agg_daily,
            hourly_forecast=agg_hourly,
            astronomy=astronomy,
            ai_summary=fallback_msg,
            confidence_score=0.5 + (0.1 * len(weather_data)),
            sources_used=sources,
            model_agreement=agreement
        )

    async def generate_ai_summary(
        self,
        weather_data: list[WeatherData],
        language: str = "en",
        confidence_bias: str = "balanced"
    ) -> Optional[str]:
        """
        Generate ONLY the AI text summary (actionable advice) via a lightweight GPT call.
        This is separate from numerical aggregation to allow lazy loading.
        """
        if not self.has_ai or not weather_data:
            return None

        # Build compact context
        sources = [w.provider for w in weather_data]
        location = weather_data[0].location
        safe_location_name = self._sanitize_prompt_input(location.name)

        context_parts = []
        for w in weather_data:
            if w.current:
                context_parts.append(f"{w.provider}: {w.current.temperature}°C, {w.current.weather_description}, wind {w.current.wind_speed}km/h, humidity {w.current.humidity}%")
                if w.current.feels_like is not None:
                    context_parts[-1] += f", feels {w.current.feels_like}°C"
            if w.daily_forecast:
                d0 = w.daily_forecast[0]
                if d0.precipitation_probability is not None:
                    context_parts[-1] += f", precip {d0.precipitation_probability}%"

        bias_hint = {
            "cautious": "Lean towards worse conditions for safety.",
            "optimistic": "Lean towards better conditions, but warn about dangers.",
            "balanced": "Be balanced."
        }.get(confidence_bias, "")

        lang_name = "Czech" if language == "cs" else "English"

        system_prompt = f"""You are a friendly personal weather assistant. Generate a short, actionable weather summary.

Write in {lang_name}. {bias_hint}

Focus on:
- What to wear (coat, umbrella, sunglasses)
- Specific hazards (slippery, high winds)
- Friendly, conversational tone

Return a JSON object with ONLY:
- "summary": your advice (2-3 sentences, in {lang_name})"""

        user_prompt = f"""Location: {safe_location_name}
Data from {len(sources)} sources:
{chr(10).join(context_parts)}"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-5.4-nano",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=300,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            if not content:
                return None

            result = json.loads(content)
            return result.get("summary")

        except Exception as e:
            print(f"[WARN] AI summary generation failed: {e}")
            # Try backup model
            try:
                response = await self.client.chat.completions.create(
                    model="gpt-5-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_completion_tokens=300,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                if content:
                    result = json.loads(content)
                    return result.get("summary")
            except Exception as e2:
                print(f"[ERR] AI summary backup (gpt-5-mini) failed: {e2}")
            return None
    
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
        is_night = current_hour < 6 or current_hour >= 20
        is_sunrise = 5 <= current_hour <= 7
        is_sunset = 18 <= current_hour <= 19
        
        weather_code = current_weather.weather_code or 0
        cloud_cover = current_weather.cloud_cover or 0
        
        # Check for active eclipses (within 1 hour)
        if astronomy:
            now = datetime.utcnow()
            
            # Solar Eclipse
            if astronomy.next_solar_eclipse:
                try:
                    solar_time = datetime.fromisoformat(astronomy.next_solar_eclipse.replace("Z", "+00:00")).replace(tzinfo=None)
                    if abs((solar_time - now).total_seconds()) <= 3600:
                         return {
                             "theme": "solar_eclipse",
                             "gradient": ["#000000", "#1a0b2e", "#4b1d52"],
                             "effect": "stars"
                         }
                except:
                    pass
            
            # Lunar Eclipse
            if astronomy.next_lunar_eclipse:
                try:
                    lunar_time = datetime.fromisoformat(astronomy.next_lunar_eclipse.replace("Z", "+00:00")).replace(tzinfo=None)
                    if abs((lunar_time - now).total_seconds()) <= 3600:
                         return {
                             "theme": "lunar_eclipse",
                             "gradient": ["#1a0b2e", "#4a0e2e", "#8b0000"],
                             "effect": "stars"
                         }
                except:
                    pass
        
        # Hail conditions (codes 96, 99)
        if weather_code in [96, 99]:
            if is_night:
                return {
                    "theme": "hail_night",
                    "gradient": ["#2d3436", "#2c3e50", "#4a5568"],
                    "effect": None
                }
            return {
                "theme": "hail",
                "gradient": ["#606c88", "#3f4c6b", "#BDBBBE"],
                "effect": None
            }

        # Sandstorm (codes 30-35 OR description check)
        # Note: WMO codes 30-35 are dust/sand, but might not be standard in all providers.
        # Checking description is safer for "sand" or "dust".
        description = getattr(current_weather, 'weather_description', '') or ''
        if weather_code in [30, 31, 32, 33, 34, 35] or 'sand' in description.lower() or 'dust' in description.lower():
            if is_night:
                return {
                    "theme": "sandstorm_night",
                    "gradient": ["#5c4033", "#3e2723", "#4a3728"],
                    "effect": None
                }
            return {
                "theme": "sandstorm",
                "gradient": ["#c9aa88", "#e4d5b7", "#d6cebf"],
                "effect": None
            }

        # Blizzard (Snow + High Wind > 50km/h)
        # Snow codes: 71, 73, 75, 77, 85, 86
        wind_speed = current_weather.wind_speed or 0
        if weather_code in [71, 73, 75, 77, 85, 86] and wind_speed >= 50:
            if is_night:
                return {
                    "theme": "blizzard_night",
                    "gradient": ["#1a2a3a", "#2c3e50", "#34495e"],
                    "effect": None
                }
            return {
                "theme": "blizzard",
                "gradient": ["#cfd9df", "#e2ebf0", "#fdfbfb"],
                "effect": None
            }

        # Storm conditions (codes 95-99)
        if weather_code >= 95:
            return {
                "theme": "storm",
                "gradient": ["#1a0a2e", "#16213e", "#0f0f0f"],
                "effect": "lightning"
            }
            
        # Extreme Heat (>32°C) - prioritize over sunny, but maybe not over rain? (Rain usually cools it down anyway)
        # Check current temperature
        temp = current_weather.temperature
        if temp is not None and temp >= 32:
            if is_night:
                return {
                    "theme": "extreme_heat_night",
                    "gradient": ["#8b2500", "#c0392b", "#6b1d1d"],
                    "effect": None
                }
            return {
                "theme": "extreme_heat",
                "gradient": ["#ff4e50", "#f9d423", "#ff9a9e"],
                "effect": None
            }
            
        # Extreme Cold (<-15°C)
        if temp is not None and temp <= -15:
            if is_night:
                return {
                    "theme": "extreme_cold_night",
                    "gradient": ["#0a1628", "#1a2980", "#0d1b3e"],
                    "effect": None
                }
            return {
                "theme": "extreme_cold",
                "gradient": ["#00c6ff", "#0072ff", "#a1c4fd"],
                "effect": None
            }
            
        # Wind (>40 km/h)
        wind = current_weather.wind_speed
        if wind is not None and wind >= 40:
            if is_night:
                return {
                    "theme": "wind_night",
                    "gradient": ["#1a3a4a", "#2c3e50", "#1e272e"],
                    "effect": None
                }
            return {
                "theme": "wind",
                "gradient": ["#4CA1AF", "#C4E0E5", "#2C3E50"],
                "effect": None
            }
            
        # Fog conditions (codes 45, 48)
        if weather_code in [45, 48]:
            if is_night:
                return {
                    "theme": "fog_night",
                    "gradient": ["#0f2027", "#203a43", "#2c5364"],
                    "effect": None
                }
            else:
                return {
                    "theme": "fog",
                    "gradient": ["#B0BEC5", "#CFD8DC", "#ECEFF1"],
                    "effect": None
                }

        # Rain conditions (codes 51-67, 80-82)
        if 51 <= weather_code <= 67 or 80 <= weather_code <= 82:
            if is_night:
                return {
                    "theme": "rain_night",
                    "gradient": ["#000046", "#1CB5E0", "#000851"],
                    "effect": None
                }
            else:
                return {
                    "theme": "rain",
                    "gradient": ["#4a6fa5", "#6b8cae", "#8fa8c2"],
                    "effect": None
                }
        
        # Snow conditions (codes 71-77, 85-86)
        if 71 <= weather_code <= 77 or 85 <= weather_code <= 86:
            if is_night:
                return {
                    "theme": "snow_night",
                    "gradient": ["#1e3c72", "#2a5298", "#2c5364"],
                    "effect": None
                }
            else:
                return {
                    "theme": "snow",
                    "gradient": ["#e8f4f8", "#d4e8ed", "#b8d4e3"],
                    "effect": None
                }
        
        # Cloudy/overcast conditions (codes 2-3)
        # Also use cloudy if cloud cover is high
        if weather_code in [2, 3] or cloud_cover >= 70:
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
