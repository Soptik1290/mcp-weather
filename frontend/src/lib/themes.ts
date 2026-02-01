/**
 * Ambient theme gradients based on weather conditions and time of day
 */

export type ThemeName =
    | 'sunny'
    | 'rain'
    | 'snow'
    | 'storm'
    | 'cloudy'
    | 'sunrise'
    | 'sunset'
    | 'clear_night'
    | 'cloudy_night'
    | 'fog'
    | 'fog_night'
    | 'extreme_heat'
    | 'extreme_cold'
    | 'wind'
    | 'hail'
    | 'snow_night'
    | 'rain_night'
    | 'sandstorm'
    | 'blizzard';

export interface AmbientTheme {
    theme: ThemeName;
    gradient: string[];
    effect?: 'lightning' | 'stars' | null;
}

// Theme gradient definitions
export const THEMES: Record<ThemeName, AmbientTheme> = {
    sunny: {
        theme: 'sunny',
        gradient: ['#f6d365', '#fda085', '#ffecd2'],
        effect: null,
    },
    rain: {
        theme: 'rain',
        gradient: ['#4a6fa5', '#6b8cae', '#8fa8c2'],
        effect: null,
    },
    snow: {
        theme: 'snow',
        gradient: ['#e8f4f8', '#d4e8ed', '#b8d4e3'],
        effect: null,
    },
    storm: {
        theme: 'storm',
        gradient: ['#1a0a2e', '#16213e', '#0f0f0f'],
        effect: 'lightning',
    },
    cloudy: {
        theme: 'cloudy',
        gradient: ['#8e9eab', '#c5d5e4', '#eef2f3'],
        effect: null,
    },
    sunrise: {
        theme: 'sunrise',
        gradient: ['#ff9a9e', '#fecfef', '#ffd89b'],
        effect: null,
    },
    sunset: {
        theme: 'sunset',
        gradient: ['#fa709a', '#fee140', '#642b73'],
        effect: null,
    },
    clear_night: {
        theme: 'clear_night',
        gradient: ['#0f0c29', '#302b63', '#24243e'],
        effect: 'stars',
    },
    cloudy_night: {
        theme: 'cloudy_night',
        gradient: ['#2c3e50', '#34495e', '#1a1a2e'],
        effect: null,
    },
    fog: {
        theme: 'fog',
        gradient: ['#B0BEC5', '#CFD8DC', '#ECEFF1'],
        effect: null,
    },
    fog_night: {
        theme: 'fog_night',
        gradient: ['#0f2027', '#203a43', '#2c5364'],
        effect: null,
    },
    extreme_heat: {
        theme: 'extreme_heat',
        gradient: ['#ff4e50', '#f9d423', '#ff9a9e'],
        effect: null,
    },
    extreme_cold: {
        theme: 'extreme_cold',
        gradient: ['#00c6ff', '#0072ff', '#a1c4fd'],
        effect: null,
    },
    wind: {
        theme: 'wind',
        gradient: ['#4CA1AF', '#C4E0E5', '#2C3E50'],
        effect: null,
    },
    hail: {
        theme: 'hail',
        gradient: ['#606c88', '#3f4c6b', '#BDBBBE'],
        effect: null,
    },
    snow_night: {
        theme: 'snow_night',
        gradient: ['#1e3c72', '#2a5298', '#2c5364'],
        effect: null,
    },
    rain_night: {
        theme: 'rain_night',
        gradient: ['#000046', '#1CB5E0', '#000851'],
        effect: null,
    },
    sandstorm: {
        theme: 'sandstorm',
        gradient: ['#c9aa88', '#e4d5b7', '#d6cebf'],
        effect: null,
    },
    blizzard: {
        theme: 'blizzard',
        gradient: ['#cfd9df', '#e2ebf0', '#fdfbfb'],
        effect: null,
    },
};

// Get CSS gradient string from theme
export function getGradientStyle(theme: AmbientTheme): string {
    const colors = theme.gradient.join(', ');
    return `linear-gradient(135deg, ${colors})`;
}

// Determine if theme is dark (for text contrast)
export function isDarkTheme(themeName: ThemeName): boolean {
    return ['storm', 'clear_night', 'cloudy_night', 'sunset'].includes(themeName);
}
