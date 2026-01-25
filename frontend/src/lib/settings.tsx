'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export type Language = 'en' | 'cs';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type TimeFormat = '24h' | '12h';

interface Settings {
    language: Language;
    temperatureUnit: TemperatureUnit;
    timeFormat: TimeFormat;
}

interface SettingsContextType extends Settings {
    setLanguage: (lang: Language) => void;
    setTemperatureUnit: (unit: TemperatureUnit) => void;
    setTimeFormat: (format: TimeFormat) => void;
    formatTemperature: (celsius: number) => string;
    formatTime: (date: Date) => string;
    t: (key: string) => string;
    getDayName: (date: Date, short?: boolean) => string;
    getWeatherDescription: (code: number | undefined | null) => string;
}

// Weather code to description mapping
const weatherDescriptions: Record<Language, Record<number, string>> = {
    en: {
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
    },
    cs: {
        0: 'Jasno',
        1: 'Převážně jasno',
        2: 'Polojasno',
        3: 'Zataženo',
        45: 'Mlha',
        48: 'Námrazová mlha',
        51: 'Slabé mrholení',
        53: 'Mrholení',
        55: 'Silné mrholení',
        56: 'Slabé mrznoucí mrholení',
        57: 'Silné mrznoucí mrholení',
        61: 'Slabý déšť',
        63: 'Déšť',
        65: 'Silný déšť',
        66: 'Slabý mrznoucí déšť',
        67: 'Silný mrznoucí déšť',
        71: 'Slabé sněžení',
        73: 'Sněžení',
        75: 'Silné sněžení',
        77: 'Sněhová zrna',
        80: 'Slabé přeháňky',
        81: 'Přeháňky',
        82: 'Silné přeháňky',
        85: 'Slabé sněhové přeháňky',
        86: 'Silné sněhové přeháňky',
        95: 'Bouřka',
        96: 'Bouřka s kroupami',
        99: 'Bouřka se silnými kroupami',
    },
};

// Day names
const dayNames: Record<Language, { short: string[]; long: string[] }> = {
    en: {
        short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    cs: {
        short: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
        long: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'],
    },
};

// Translations
const translations: Record<Language, Record<string, string>> = {
    en: {
        // Weather cards
        'wind': 'Wind',
        'humidity': 'Humidity',
        'uv_index': 'UV Index',
        'rain': 'Rain',
        'sunrise': 'Sunrise',
        'sunset': 'Sunset',
        'feels_like': 'Feels like',
        'now': 'Now',
        'expected': 'Expected',

        // Humidity levels
        'dry': 'Dry',
        'comfortable': 'Comfortable',
        'humid': 'Humid',
        'very_humid': 'Very humid',

        // UV levels
        'low': 'Low',
        'moderate': 'Moderate',
        'high': 'High',
        'very_high': 'Very High',
        'extreme': 'Extreme',

        // Forecast
        'hourly_forecast': 'Hourly Forecast',
        'daily_forecast': '7-Day Forecast',
        'today': 'Today',

        // Search
        'search_city': 'Search city...',

        // Menu
        'settings': 'Settings',
        'language': 'Language',
        'choose_language': 'Choose your preferred language',
        'temperature': 'Temperature',
        'select_unit': 'Select temperature unit',
        'time_format': 'Time Format',
        'select_time_format': 'Select time format',
        'about': 'About',
        'about_desc': 'Weather AI Aggregator',
        'about_text': 'AI-powered weather aggregation from 4 sources with intelligent deduction.',
        'view_github': 'View on GitHub',

        // AI Summary
        'ai_forecast': 'AI-powered forecast',
        'confidence': 'Confidence',
        'aggregated_from': 'Aggregated from',
        'sources': 'sources',
    },
    cs: {
        // Weather cards
        'wind': 'Vítr',
        'humidity': 'Vlhkost',
        'uv_index': 'UV Index',
        'rain': 'Déšť',
        'sunrise': 'Východ slunce',
        'sunset': 'Západ slunce',
        'feels_like': 'Pocitově',
        'now': 'Teď',
        'expected': 'Očekáváno',

        // Humidity levels
        'dry': 'Sucho',
        'comfortable': 'Příjemná',
        'humid': 'Vlhko',
        'very_humid': 'Velmi vlhko',

        // UV levels
        'low': 'Nízký',
        'moderate': 'Střední',
        'high': 'Vysoký',
        'very_high': 'Velmi vysoký',
        'extreme': 'Extrémní',

        // Forecast
        'hourly_forecast': 'Hodinová předpověď',
        'daily_forecast': '7denní předpověď',
        'today': 'Dnes',

        // Search
        'search_city': 'Hledat město...',

        // Menu
        'settings': 'Nastavení',
        'language': 'Jazyk',
        'choose_language': 'Vyberte preferovaný jazyk',
        'temperature': 'Teplota',
        'select_unit': 'Vyberte jednotku teploty',
        'time_format': 'Formát času',
        'select_time_format': 'Vyberte formát času',
        'about': 'O aplikaci',
        'about_desc': 'Weather AI Agregátor',
        'about_text': 'AI agregace počasí ze 4 zdrojů s inteligentní dedukcí.',
        'view_github': 'Zobrazit na GitHubu',

        // AI Summary
        'ai_forecast': 'AI předpověď',
        'confidence': 'Spolehlivost',
        'aggregated_from': 'Agregováno z',
        'sources': 'zdrojů',
    },
};

const STORAGE_KEY = 'weather-app-settings';

// Detect browser language
function detectBrowserLanguage(): Language {
    if (typeof navigator === 'undefined') return 'en';
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    return browserLang.startsWith('cs') ? 'cs' : 'en';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({
        language: 'en',
        temperatureUnit: 'celsius',
        timeFormat: '24h',
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage on mount, detect browser language if first visit
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({
                    language: parsed.language || 'en',
                    temperatureUnit: parsed.temperatureUnit || 'celsius',
                    timeFormat: parsed.timeFormat || '24h',
                });
            } else {
                // First visit - detect browser language
                const detectedLang = detectBrowserLanguage();
                setSettings({
                    language: detectedLang,
                    temperatureUnit: 'celsius',
                    timeFormat: '24h',
                });
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        setIsLoaded(true);
    }, []);

    // Save settings to localStorage when they change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch (e) {
                console.error('Failed to save settings:', e);
            }
        }
    }, [settings, isLoaded]);

    const setLanguage = (lang: Language) => {
        setSettings(prev => ({ ...prev, language: lang }));
    };

    const setTemperatureUnit = (unit: TemperatureUnit) => {
        setSettings(prev => ({ ...prev, temperatureUnit: unit }));
    };

    const setTimeFormat = (format: TimeFormat) => {
        setSettings(prev => ({ ...prev, timeFormat: format }));
    };

    // Convert Celsius to Fahrenheit if needed
    const formatTemperature = (celsius: number): string => {
        if (settings.temperatureUnit === 'fahrenheit') {
            const fahrenheit = (celsius * 9 / 5) + 32;
            return `${Math.round(fahrenheit)}°F`;
        }
        return `${Math.round(celsius)}°C`;
    };

    // Format time based on selected format
    const formatTime = (date: Date): string => {
        if (settings.timeFormat === '12h') {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        }
        return date.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    // Translation function
    const t = (key: string): string => {
        return translations[settings.language][key] || key;
    };

    // Get day name
    const getDayName = (date: Date, short: boolean = true): string => {
        const dayIndex = date.getDay();
        return short
            ? dayNames[settings.language].short[dayIndex]
            : dayNames[settings.language].long[dayIndex];
    };

    // Get weather description (translated)
    const getWeatherDescription = (code: number | undefined | null): string => {
        if (code === undefined || code === null) return '';
        return weatherDescriptions[settings.language][code] || `Code ${code}`;
    };

    return (
        <SettingsContext.Provider
            value={{
                ...settings,
                setLanguage,
                setTemperatureUnit,
                setTimeFormat,
                formatTemperature,
                formatTime,
                t,
                getDayName,
                getWeatherDescription,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
