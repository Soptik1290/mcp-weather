/**
 * Weather icon mapping based on WMO weather codes
 * Ported from PC frontend to match styling
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
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

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

// Get color for weather icon based on weather code
export function getWeatherIconColor(code: number | undefined, isDark: boolean = false): string {
    if (code === undefined) return isDark ? '#FFF' : '#333';

    // Clear - yellow/orange
    if (code === 0) return '#FBBF24';

    // Partly cloudy - lighter yellow
    if (code === 1 || code === 2) return '#FCD34D';

    // Overcast - gray
    if (code === 3) return '#9CA3AF';

    // Fog - light gray
    if (code === 45 || code === 48) return '#D1D5DB';

    // Drizzle - light blue
    if (code >= 51 && code <= 57) return '#93C5FD';

    // Rain - blue
    if (code >= 61 && code <= 67) return '#60A5FA';

    // Snow - light blue/white
    if (code >= 71 && code <= 77) return '#BFDBFE';

    // Rain showers - darker blue
    if (code >= 80 && code <= 82) return '#3B82F6';

    // Snow showers - light blue
    if (code >= 85 && code <= 86) return '#DBEAFE';

    // Thunderstorm - purple/yellow
    if (code >= 95 && code <= 99) return '#A78BFA';

    return isDark ? '#FFF' : '#333';
}

// Get weather description from code (Czech)
export function getWeatherDescription(code: number | undefined): string {
    if (code === undefined) return 'Neznámé';

    const descriptions: Record<number, string> = {
        0: 'Jasno',
        1: 'Převážně jasno',
        2: 'Částečně oblačno',
        3: 'Zataženo',
        45: 'Mlha',
        48: 'Námrazová mlha',
        51: 'Slabé mrholení',
        53: 'Mírné mrholení',
        55: 'Husté mrholení',
        56: 'Slabé mrznoucí mrholení',
        57: 'Husté mrznoucí mrholení',
        61: 'Slabý déšť',
        63: 'Mírný déšť',
        65: 'Silný déšť',
        66: 'Slabý mrznoucí déšť',
        67: 'Silný mrznoucí déšť',
        71: 'Slabé sněžení',
        73: 'Mírné sněžení',
        75: 'Silné sněžení',
        77: 'Sněhová zrna',
        80: 'Slabé přeháňky',
        81: 'Mírné přeháňky',
        82: 'Silné přeháňky',
        85: 'Slabé sněhové přeháňky',
        86: 'Silné sněhové přeháňky',
        95: 'Bouřka',
        96: 'Bouřka se slabým krupobitím',
        99: 'Bouřka se silným krupobitím',
    };

    return descriptions[code] || 'Neznámé';
}
