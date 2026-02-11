import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const defaultSettings: UserSettings = {
    language: 'cs',
    temperature_unit: 'celsius',
    time_format: '24h',
    confidence_bias: 'balanced',
    aurora_display: 'auto',
    theme_mode: 'auto',
    notifications_enabled: true,
    aurora_alerts: true,
    iss_alerts: false,
    haptic_enabled: true,
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
interface SubscriptionState {
    subscription: SubscriptionInfo;
    setSubscription: (info: SubscriptionInfo) => void;
    isPro: () => boolean;
    isUltra: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscription: {
        tier: 'free',
        is_active: true,
        will_renew: false,
    },
    setSubscription: (info) => set({ subscription: info }),
    isPro: () => {
        const tier = get().subscription.tier;
        return tier === 'pro' || tier === 'ultra';
    },
    isUltra: () => get().subscription.tier === 'ultra',
}));

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
