/**
 * Type definitions for weather data from MCP server
 */

export interface Location {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    timezone?: string;
}

export interface CurrentWeather {
    temperature: number;
    feels_like?: number;
    humidity?: number;
    wind_speed?: number;
    wind_direction?: number;
    weather_code?: number;
    weather_description?: string;
    uv_index?: number;
    visibility?: number;
    pressure?: number;
    cloud_cover?: number;
}

export interface DailyForecast {
    date: string;
    temperature_max: number;
    temperature_min: number;
    weather_code?: number;
    weather_description?: string;
    precipitation_probability?: number;
    precipitation_sum?: number;
    wind_speed_max?: number;
    uv_index_max?: number;
    sunrise?: string;
    sunset?: string;
    snowfall_sum?: number;
}

export interface HourlyForecast {
    time: string;
    temperature: number;
    weather_code?: number;
    weather_description?: string;
    precipitation_probability?: number;
    wind_speed?: number;
    humidity?: number;
}

export interface Astronomy {
    sunrise?: string;
    sunset?: string;
    moon_phase?: number;
    moon_phase_name?: string;
}

export interface AmbientTheme {
    theme: string;
    gradient: string[];
    effect?: string | null;
}

export interface WeatherResponse {
    location: Location;
    current: CurrentWeather | null;
    daily_forecast?: DailyForecast[];
    hourly_forecast?: HourlyForecast[];
    astronomy?: Astronomy | null;
    ai_summary?: string;
    confidence?: number;
    ambient_theme?: AmbientTheme;
    sources?: string[];
}
