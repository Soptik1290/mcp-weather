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
    | 'cloudy_night';

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
