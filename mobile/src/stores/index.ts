import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import type {
    UserSettings,
    SubscriptionInfo,
    Location,
    WidgetConfig
} from '../types';

// User Settings Store
interface SettingsState {
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
    resetSettings: () => void;
}

// Auto-detect device language
function getDeviceLanguage(): 'cs' | 'en' {
    try {
        let locale = '';
        if (Platform.OS === 'ios') {
            locale = NativeModules.SettingsManager?.settings?.AppleLocale
                || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
                || 'en';
        } else {
            locale = NativeModules.I18nManager?.localeIdentifier || 'en';
        }
        return locale.toLowerCase().startsWith('cs') ? 'cs' : 'en';
    } catch {
        return 'en';
    }
}

const defaultSettings: UserSettings = {
    language: getDeviceLanguage(),
    temperature_unit: 'celsius',
    time_format: '24h',
    confidence_bias: 'balanced',
    aurora_display: 'auto',
    theme_mode: 'auto',
    notifications_enabled: true,
    aurora_alerts: true,
    iss_alerts: false,
    haptic_enabled: true,
    aurora_notifications: false,
    eclipse_notifications: false,
    daily_brief: false,
    hasCompletedOnboarding: false,
    show_wind_chart: true,
    show_pressure_chart: true,
    show_precipitation_chart: true,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),
            resetSettings: () => set({ settings: defaultSettings }),
        }),
        {
            name: 'weatherly-settings',
            storage: createJSONStorage(() => AsyncStorage),
            merge: (persistedState: any, currentState: SettingsState) => ({
                ...currentState,
                ...persistedState,
                settings: {
                    ...defaultSettings,
                    ...(persistedState as any)?.settings,
                },
            }),
        }
    )
);

// Subscription Store
// Subscription Store
export const SubscriptionTier = {
    Free: 'free',
    Pro: 'pro',
    Ultra: 'ultra',
} as const;

export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

interface SubscriptionState {
    tier: SubscriptionTier;
    features: {
        canCustomizeWidget: boolean;
        isAiAdvanced: boolean;
        hasAstroPack: boolean;
        hasExplainMode: boolean;
        hasConfidenceBias: boolean;
    };
    setTier: (tier: SubscriptionTier) => void;
    isPro: () => boolean; // Checks if tier is Pro OR Ultra
    isUltra: () => boolean;
}

const getFeaturesForTier = (tier: SubscriptionTier) => ({
    canCustomizeWidget: tier === 'pro' || tier === 'ultra',
    isAiAdvanced: tier === 'pro' || tier === 'ultra',
    hasAstroPack: tier === 'ultra',
    hasExplainMode: tier === 'ultra',
    hasConfidenceBias: tier === 'ultra',
});

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            tier: 'free',
            features: getFeaturesForTier('free'),
            setTier: (tier) => set({
                tier,
                features: getFeaturesForTier(tier)
            }),
            isPro: () => {
                const tier = get().tier;
                return tier === 'pro' || tier === 'ultra';
            },
            isUltra: () => get().tier === 'ultra',
        }),
        {
            name: 'weatherly-subscription',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Location Store
interface LocationState {
    currentLocation: Location | null;
    savedLocations: Location[];
    setCurrentLocation: (location: Location | null) => void;
    addSavedLocation: (location: Location) => void;
    removeSavedLocation: (name: string) => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
            currentLocation: null,
            savedLocations: [],
            setCurrentLocation: (location) => set({ currentLocation: location }),
            addSavedLocation: (location) =>
                set((state) => ({
                    savedLocations: [...state.savedLocations, location],
                })),
            removeSavedLocation: (name) =>
                set((state) => ({
                    savedLocations: state.savedLocations.filter((l) => l.name !== name),
                })),
        }),
        {
            name: 'weatherly-locations',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Widget Configuration Store
interface WidgetState {
    widgets: WidgetConfig[];
    addWidget: (widget: WidgetConfig) => void;
    updateWidget: (id: string, config: Partial<WidgetConfig>) => void;
    removeWidget: (id: string) => void;
}

export const useWidgetStore = create<WidgetState>()(
    persist(
        (set) => ({
            widgets: [],
            addWidget: (widget) =>
                set((state) => ({ widgets: [...state.widgets, widget] })),
            updateWidget: (id, config) =>
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, ...config } : w
                    ),
                })),
            removeWidget: (id) =>
                set((state) => ({
                    widgets: state.widgets.filter((w) => w.id !== id),
                })),
        }),
        {
            name: 'weatherly-widgets',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
