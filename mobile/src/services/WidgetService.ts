import NativeSharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';

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
}

class WidgetService {
    async updateWidget(data: WidgetData) {
        if (Platform.OS !== 'android') return;

        try {
            const groupName = ANDROID_PREFERENCES_NAME;
            const options = { useAndroidSharedPreferences: true };

            const items: [string, any][] = [
                ['temperature', data.temperature],
                ['city', data.city],
                ['description', data.description],
                ['weatherCode', data.weatherCode],
                ['updatedAt', data.updatedAt],
                ['isNight', data.isNight],
                ['gradientStart', data.gradientStart],
                ['gradientEnd', data.gradientEnd],
            ];

            await Promise.all(
                items.map(([key, value]) =>
                    NativeSharedGroupPreferences.setItem(key, value, groupName, options)
                )
            );

        } catch (error) {
            console.error('Failed to update widget data:', error);
        }
    }
}

export const widgetService = new WidgetService();
