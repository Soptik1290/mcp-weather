'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export type Language = 'en' | 'cs';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

interface Settings {
    language: Language;
    temperatureUnit: TemperatureUnit;
}

interface SettingsContextType extends Settings {
    setLanguage: (lang: Language) => void;
    setTemperatureUnit: (unit: TemperatureUnit) => void;
    formatTemperature: (celsius: number) => string;
    t: (key: string) => string;
}

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
        'about': 'About',
        'about_desc': 'Weather AI Aggregator',
        'about_text': 'AI-powered weather aggregation from 4 sources with intelligent deduction.',
        'view_github': 'View on GitHub',

        // AI Summary
        'ai_forecast': 'AI-powered forecast',
        'confidence': 'Confidence',
        'aggregated_from': 'Aggregated from',
        'sources': 'sources',

        // Days
        'mon': 'Mon',
        'tue': 'Tue',
        'wed': 'Wed',
        'thu': 'Thu',
        'fri': 'Fri',
        'sat': 'Sat',
        'sun': 'Sun',
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
        'about': 'O aplikaci',
        'about_desc': 'Weather AI Agregátor',
        'about_text': 'AI agregace počasí ze 4 zdrojů s inteligentní dedukcí.',
        'view_github': 'Zobrazit na GitHubu',

        // AI Summary
        'ai_forecast': 'AI předpověď',
        'confidence': 'Spolehlivost',
        'aggregated_from': 'Agregováno z',
        'sources': 'zdrojů',

        // Days
        'mon': 'Po',
        'tue': 'Út',
        'wed': 'St',
        'thu': 'Čt',
        'fri': 'Pá',
        'sat': 'So',
        'sun': 'Ne',
    },
};

const STORAGE_KEY = 'weather-app-settings';

const defaultSettings: Settings = {
    language: 'en',
    temperatureUnit: 'celsius',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...defaultSettings, ...parsed });
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

    // Convert Celsius to Fahrenheit if needed
    const formatTemperature = (celsius: number): string => {
        if (settings.temperatureUnit === 'fahrenheit') {
            const fahrenheit = (celsius * 9 / 5) + 32;
            return `${Math.round(fahrenheit)}°F`;
        }
        return `${Math.round(celsius)}°C`;
    };

    // Translation function
    const t = (key: string): string => {
        return translations[settings.language][key] || key;
    };

    return (
        <SettingsContext.Provider
            value={{
                ...settings,
                setLanguage,
                setTemperatureUnit,
                formatTemperature,
                t,
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
