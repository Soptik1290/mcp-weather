import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface GeolocationPosition {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface UseGeolocationResult {
    position: GeolocationPosition | null;
    loading: boolean;
    error: string | null;
    getCurrentPosition: () => Promise<GeolocationPosition | null>;
}

export function useGeolocation(): UseGeolocationResult {
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestAndroidPermission = async (): Promise<boolean> => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Povolení polohy',
                    message: 'Weatherly potřebuje přístup k vaší poloze pro zobrazení místního počasí.',
                    buttonNeutral: 'Zeptat se později',
                    buttonNegative: 'Zamítnout',
                    buttonPositive: 'Povolit',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission error:', err);
            return false;
        }
    };

    const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
        setLoading(true);
        setError(null);

        // Request permission on Android
        if (Platform.OS === 'android') {
            const hasPermission = await requestAndroidPermission();
            if (!hasPermission) {
                setError('Přístup k poloze byl zamítnut');
                setLoading(false);
                Alert.alert(
                    'Povolení zamítnuto',
                    'Pro použití geolokace povolte přístup k poloze v nastavení.',
                    [
                        { text: 'Zrušit', style: 'cancel' },
                        { text: 'Nastavení', onPress: () => Linking.openSettings() },
                    ]
                );
                return null;
            }
        }

        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    const coords: GeolocationPosition = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    };
                    setPosition(coords);
                    setLoading(false);
                    resolve(coords);
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    let errorMessage = 'Nepodařilo se získat polohu';

                    switch (err.code) {
                        case 1: // PERMISSION_DENIED
                            errorMessage = 'Přístup k poloze byl zamítnut';
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            errorMessage = 'Poloha není dostupná';
                            break;
                        case 3: // TIMEOUT
                            errorMessage = 'Časový limit pro získání polohy vypršel';
                            break;
                    }

                    setError(errorMessage);
                    setLoading(false);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000, // Cache for 1 minute
                }
            );
        });
    }, []);

    return {
        position,
        loading,
        error,
        getCurrentPosition,
    };
}

export default useGeolocation;
