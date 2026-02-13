import NativeSharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform, NativeModules } from 'react-native';

const APP_GROUP_IDENTIFIER = 'group.com.weatherly.ai'; // Not strictly needed for Android SharedPrefs but good practice for iOS if we add it later
const ANDROID_PREFERENCES_NAME = 'WeatherlyWidgetPrefs';

export interface WidgetData {
    temperature: number;
    weatherCode: number;
    city: string;
    description: string;
    updatedAt: number;
    isNight: boolean;
    gradientStart: string;
    gradientEnd: string;
    customization?: {
        opacity: number;
        theme: string;
        fixed_color?: string;
    };
    hourly?: Array<{
        time: string;
        temperature: number;
        weatherCode: number;
    }>;
    daily?: Array<{
        date: string;
        maxTemp: number;
        minTemp: number;
        weatherCode: number;
    }>;
    astronomy?: {
        sunrise: string;
        sunset: string;
        moonPhase: string;
    };
    aurora?: {
        kp: number;
        visibilityProb: number;
    };
}

class WidgetService {
    async updateWidget(data: WidgetData) {
        if (Platform.OS !== 'android') return;

        try {
            const groupName = ANDROID_PREFERENCES_NAME;
            const options = { useAndroidSharedPreferences: true };

            /* eslint-disable @typescript-eslint/no-explicit-any */
            const items: [string, any][] = [
                ['temperature', String(Math.round(data.temperature))],
                ['city', data.city],
                ['description', data.description],
                ['weatherCode', String(data.weatherCode)],
                ['updatedAt', String(data.updatedAt)],
                ['isNight', String(data.isNight)], // Convert boolean to string
                ['gradientStart', data.gradientStart],
                ['gradientEnd', data.gradientEnd],
                ['opacity', String(data.customization?.opacity ?? 255)], // Convert number to string
                ['theme', data.customization?.theme ?? 'auto'],
                ['fixedColor', data.customization?.fixed_color ?? ''],
                ['hourly', JSON.stringify(data.hourly ?? [])],
                ['daily', JSON.stringify(data.daily ?? [])],
                ['astronomy', JSON.stringify(data.astronomy ?? {})],
                ['aurora', JSON.stringify(data.aurora ?? {})],
            ];

            console.log('WidgetService: Saving data to', groupName, items);
            await Promise.all(
                items.map(([key, value]) =>
                    NativeSharedGroupPreferences.setItem(key, value, groupName, options)
                )
            );
            console.log('WidgetService: Data saved successfully');

            // Trigger native widget update
            if (NativeModules.WidgetModule) {
                NativeModules.WidgetModule.reloadAllWidgets();
                console.log('WidgetService: Triggered native widget reload');
            } else {
                console.warn('WidgetService: Native WidgetModule not found');
            }

        } catch (error) {
            console.error('Failed to update widget data:', error);
        }
    }
}

export const widgetService = new WidgetService();
