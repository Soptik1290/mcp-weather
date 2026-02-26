import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { t, type Language } from '../utils';

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

export function useGeolocation(language: Language = 'cs'): UseGeolocationResult {
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestAndroidPermission = async (): Promise<boolean> => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: t('geo_permission_title', language),
                    message: t('geo_permission_msg', language),
                    buttonNeutral: t('geo_ask_later', language),
                    buttonNegative: t('geo_deny', language),
                    buttonPositive: t('geo_allow', language),
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
                setError(t('geo_permission_denied', language));
                setLoading(false);
                Alert.alert(
                    t('geo_denied_alert', language),
                    t('geo_denied_msg', language),
                    [
                        { text: t('geo_cancel', language), style: 'cancel' },
                        { text: t('geo_settings', language), onPress: () => Linking.openSettings() },
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
                    let errorMessage = t('geo_error', language);

                    switch (err.code) {
                        case 1: // PERMISSION_DENIED
                            errorMessage = t('geo_permission_denied', language);
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            errorMessage = t('geo_unavailable', language);
                            break;
                        case 3: // TIMEOUT
                            errorMessage = t('geo_timeout', language);
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
    }, [language]);

    return {
        position,
        loading,
        error,
        getCurrentPosition,
    };
}

export default useGeolocation;
