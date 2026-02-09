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

const formatTime = (timeString?: string): string => {
    if (!timeString) return '--:--';
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('cs', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return timeString;
    }
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
}: WeatherDetailsProps) {
    const iconColor = subTextColor;
    const iconSize = 22;
    const strokeWidth = 1.5;

    const details = [
        humidity !== undefined && {
            icon: <Droplets size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Vlhkost',
            value: `${humidity}%`,
        },
        windSpeed !== undefined && {
            icon: <Wind size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Vítr',
            value: `${Math.round(windSpeed)} km/h`,
        },
        feelsLike !== undefined && {
            icon: <Thermometer size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Pocitově',
            value: formatTemperature(feelsLike),
        },
        visibility !== undefined && visibility !== null && {
            icon: <Eye size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Viditelnost',
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
            label: 'Srážky',
            value: `${precipitation} mm`,
        },
        sunrise && {
            icon: <Sunrise size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Východ',
            value: formatTime(sunrise),
        },
        sunset && {
            icon: <Sunset size={iconSize} color={iconColor} strokeWidth={strokeWidth} />,
            label: 'Západ',
            value: formatTime(sunset),
        },
    ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

    if (details.length === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                Detaily počasí
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
