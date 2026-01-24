/**
 * Weather icon mapping based on WMO weather codes
 */

import {
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    CloudFog,
    CloudDrizzle,
    CloudSun,
    Moon,
    CloudMoon,
    type LucideIcon,
} from 'lucide-react';

// WMO Weather Code to Icon mapping
export function getWeatherIcon(code: number | undefined, isNight: boolean = false): LucideIcon {
    if (code === undefined) return isNight ? Moon : Sun;

    // Clear sky
    if (code === 0) return isNight ? Moon : Sun;

    // Mainly clear, partly cloudy
    if (code === 1 || code === 2) return isNight ? CloudMoon : CloudSun;

    // Overcast
    if (code === 3) return Cloud;

    // Fog
    if (code === 45 || code === 48) return CloudFog;

    // Drizzle
    if (code >= 51 && code <= 57) return CloudDrizzle;

    // Rain
    if (code >= 61 && code <= 67) return CloudRain;

    // Snow
    if (code >= 71 && code <= 77) return CloudSnow;

    // Rain showers
    if (code >= 80 && code <= 82) return CloudRain;

    // Snow showers
    if (code >= 85 && code <= 86) return CloudSnow;

    // Thunderstorm
    if (code >= 95 && code <= 99) return CloudLightning;

    return isNight ? Moon : Sun;
}

// Get weather description from code
export function getWeatherDescription(code: number | undefined): string {
    if (code === undefined) return 'Unknown';

    const descriptions: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };

    return descriptions[code] || 'Unknown';
}
