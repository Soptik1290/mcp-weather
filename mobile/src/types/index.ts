// Weather data types - matching backend models
export interface Location {
    name: string;
    original_name?: string;
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
    snowfall_sum?: number;
    wind_speed_max?: number;
    uv_index_max?: number;
    sunrise?: string;
    sunset?: string;
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
    moonrise?: string;
    moonset?: string;
    moon_phase?: number;
    moon_phase_name?: string;
    moon_illumination?: number;
    daylight_duration?: number;
    moon_distance?: number;
    next_full_moon?: string;
}

export interface WeatherData {
    location: Location;
    current?: CurrentWeather;
    daily_forecast: DailyForecast[];
    hourly_forecast: HourlyForecast[];
    astronomy?: Astronomy;
    ai_summary?: string;
    confidence_score: number;
    sources_used: string[];
    ambient_theme?: AmbientTheme;
}

export interface AmbientTheme {
    name: string;
    gradient: string[];
    is_dark: boolean;
}

// Subscription types
export type SubscriptionTier = 'free' | 'pro' | 'ultra';

export interface SubscriptionInfo {
    tier: SubscriptionTier;
    is_active: boolean;
    expires_at?: string;
    will_renew: boolean;
}

// Widget types
export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
    id: string;
    type: 'current' | 'daily' | 'hourly' | 'aurora' | 'chart';
    size: WidgetSize;
    location?: Location;
    customization: WidgetCustomization;
}

export interface WidgetCustomization {
    opacity: number; // 0-100
    theme: 'auto' | 'light' | 'dark' | 'glass' | 'gradient';
    fixed_color?: string;
    corner_radius: number; // 0-24
    font_size: 'small' | 'medium' | 'large';
}

// Settings types
export type TimeFormat = '24h' | '12h';
export type AuroraDisplay = 'auto' | 'always' | 'never';
export type ThemeMode = 'auto' | 'system' | 'dark' | 'light';

export interface UserSettings {
    language: 'en' | 'cs';
    temperature_unit: 'celsius' | 'fahrenheit';
    time_format: TimeFormat;
    confidence_bias: 'cautious' | 'balanced' | 'optimistic';
    aurora_display: AuroraDisplay;
    theme_mode: ThemeMode;
    notifications_enabled: boolean;
    aurora_alerts: boolean;
    iss_alerts: boolean;
    haptic_enabled: boolean;
}

// AstroPack types
export interface ISSPass {
    rise_time: string;
    rise_azimuth: number;
    max_altitude: number;
    set_time: string;
    set_azimuth: number;
    duration_seconds: number;
    visible: boolean;
}

export interface MeteorShower {
    name: string;
    peak_date: string;
    active_start: string;
    active_end: string;
    zhr: number; // Zenithal Hourly Rate
    radiant: {
        ra: number;
        dec: number;
        constellation: string;
    };
}

export interface StargazingIndex {
    score: number; // 0-100
    cloud_cover: number;
    light_pollution: number;
    moon_interference: number;
    best_time: string;
    recommendation: string;
}
