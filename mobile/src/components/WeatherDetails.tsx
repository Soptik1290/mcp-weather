import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import {
    Droplets,
    Wind,
    Eye,
    Gauge,
    Thermometer,
    Sunrise,
    Sunset,
    CloudRain
} from 'lucide-react-native';
import { t, formatTime as formatTimeI18n, formatTimeString } from '../utils';

import type { TimeFormat } from '../types';

interface WeatherDetailsProps {
    humidity?: number;
    windSpeed?: number;
    visibility?: number;
    pressure?: number;
    feelsLike?: number;
    uvIndex?: number;
    sunrise?: string;
    sunset?: string;
    precipitation?: number;
    textColor: string;
    subTextColor: string;
    cardBg: string;
    formatTemperature?: (temp: number) => string;
    language?: 'en' | 'cs';
    timeFormat?: TimeFormat;
}

interface DetailItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    textColor: string;
    subTextColor: string;
}

function DetailItem({ icon, label, value, textColor, subTextColor }: DetailItemProps) {
    return (
        <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
                {icon}
            </View>
            <Text style={[styles.detailValue, { color: textColor }]}>
                {value}
            </Text>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>
                {label}
            </Text>
        </View>
    );
}

const formatTime = (timeString?: string, timeFmt: TimeFormat = '24h'): string => {
    if (!timeString) return '--:--';
    // Check if it's an ISO string (contains 'T')
    if (timeString.includes('T')) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return formatTimeI18n(date, timeFmt);
        }
    }
    return formatTimeString(timeString, timeFmt);
};

export function WeatherDetails({
    humidity,
    windSpeed,
    visibility,
    pressure,
    feelsLike,
    sunrise,
    sunset,
    precipitation,
    textColor,
    subTextColor,
    cardBg,
    formatTemperature = (t) => `${Math.round(t)}°`,
    language = 'cs',
    timeFormat = '24h',
}: WeatherDetailsProps) {
    const iconColor = subTextColor;
    const iconSize = 22;
    const strokeWidth = 1.5;

    const details = [
        humidity !== undefined && {
            icon: <Droplets size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('humidity', language),
            value: `${humidity}%`,
        },
        windSpeed !== undefined && {
            icon: <Wind size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('wind', language),
            value: `${Math.round(windSpeed)} km/h`,
        },
        feelsLike !== undefined && {
            icon: <Thermometer size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('feels_like', language),
            value: formatTemperature(feelsLike),
        },
        visibility !== undefined && visibility !== null && {
            icon: <Eye size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('aurora_visibility', language),
            value: visibility >= 1000
                ? `${Math.round(visibility / 1000)} km`
                : `${Math.round(visibility)} m`,
        },
        pressure !== undefined && pressure !== null && {
            icon: <Gauge size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Tlak',
            value: `${Math.round(pressure)} hPa`,
        },
        precipitation !== undefined && precipitation > 0 && {
            icon: <CloudRain size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('precipitation', language),
            value: `${precipitation} mm`,
        },
        sunrise && {
            icon: <Sunrise size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('sunrise', language),
            value: formatTime(sunrise, timeFormat),
        },
        sunset && {
            icon: <Sunset size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: t('sunset', language),
            value: formatTime(sunset, timeFormat),
        },
    ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

    if (details.length === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                {t('current', language)}
            </Text>
            <View style={styles.grid}>
                {details.map((detail, index) => (
                    <DetailItem
                        key={detail.label}
                        icon={detail.icon}
                        label={detail.label}
                        value={detail.value}
                        textColor={textColor}
                        subTextColor={subTextColor}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailItem: {
        width: '31%',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    detailIcon: {
        marginBottom: 8,
        opacity: 0.8,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default WeatherDetails;
