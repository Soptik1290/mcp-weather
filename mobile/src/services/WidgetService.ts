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
}

class WidgetService {
    async updateWidget(data: WidgetData) {
        if (Platform.OS !== 'android') return;

        try {
            // Android SharedPreferences structure:
            // Filename: "WeatherlyWidgetPrefs" (defined by ANDROID_PREFERENCES_NAME)
            // Keys: "temperature", "city", "description", etc.

            const groupName = ANDROID_PREFERENCES_NAME;
            const options = { useAndroidSharedPreferences: true };

            // Save each field individually as expected by the native widget
            await NativeSharedGroupPreferences.setItem('temperature', data.temperature, groupName, options);
            await NativeSharedGroupPreferences.setItem('city', data.city, groupName, options);
            await NativeSharedGroupPreferences.setItem('description', data.description, groupName, options);
            await NativeSharedGroupPreferences.setItem('weatherCode', data.weatherCode, groupName, options);
            await NativeSharedGroupPreferences.setItem('updatedAt', data.updatedAt, groupName, options);
            await NativeSharedGroupPreferences.setItem('isNight', data.isNight, groupName, options);

        } catch (error) {
            console.error('Failed to update widget data:', error);
        }
    }
}

export const widgetService = new WidgetService();
