import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import {
    Sparkles,
    TrendingUp,
    MapPin,
    AlertTriangle,
    Clock,
} from 'lucide-react-native';
import { t } from '../utils';
import type { TimeFormat } from '../types';

interface AuroraData {
    current_kp: number | null;
    current_description: string;
    visibility_probability: number;
    max_forecast_kp: number | null;
    max_visibility_probability: number;
    best_viewing_time: string | null;
    best_viewing_kp: number | null;
    forecast: Array<{
        time: string;
        kp: number;
        scale: string | null;
    }>;
    source: string;
    error?: string;
}

interface AuroraCardProps {
    data: AuroraData | null;
    textColor: string;
    subTextColor: string;
    cardBg: string;
    isDark?: boolean;
    locationName?: string;
    language?: 'en' | 'cs';
    timeFormat?: TimeFormat;
}

const getKpColor = (kp: number): string => {
    if (kp < 3) return '#22C55E';  // green
    if (kp < 5) return '#EAB308';  // yellow
    if (kp < 7) return '#F97316';  // orange
    if (kp < 8) return '#EF4444';  // red
    return '#A855F7';              // purple
};

const getKpBgColor = (kp: number): string => {
    if (kp < 3) return 'rgba(34,197,94,0.2)';
    if (kp < 5) return 'rgba(234,179,8,0.2)';
    if (kp < 7) return 'rgba(249,115,22,0.2)';
    if (kp < 8) return 'rgba(239,68,68,0.2)';
    return 'rgba(168,85,247,0.2)';
};

const formatBestTime = (utcTimeStr: string, timeFmt: TimeFormat = '24h'): string => {
    try {
        const date = new Date(utcTimeStr.replace(' ', 'T') + 'Z');
        if (timeFmt === '12h') {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        }
        return date.toLocaleTimeString('cs', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch {
        return utcTimeStr;
    }
};

export function AuroraCard({
    data,
    textColor,
    subTextColor,
    cardBg,
    isDark = false,
    locationName,
    language = 'cs',
    timeFormat = '24h',
}: AuroraCardProps) {
    if (!data || data.error) {
        return (
            <View style={[styles.container, { backgroundColor: cardBg }]}>
                <View style={styles.header}>
                    <Sparkles size={16} color={subTextColor} strokeWidth={2} />
                    <Text style={[styles.headerText, { color: subTextColor }]}>
                        {t('aurora', language)}
                    </Text>
                </View>
                <Text style={[styles.unavailableText, { color: subTextColor }]}>
                    {t('aurora_unavailable', language)}
                </Text>
            </View>
        );
    }

    const currentKp = data.current_kp ?? 0;
    const visibilityProb = data.visibility_probability;
    const isStorm = currentKp >= 5;
    const kpColor = getKpColor(currentKp);

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            {/* Header */}
            <View style={styles.header}>
                <Sparkles size={16} color={isStorm ? '#A855F7' : subTextColor} strokeWidth={2} />
                <Text style={[styles.headerText, { color: subTextColor }]}>
                    {t('aurora', language)}
                </Text>
                {isStorm && (
                    <View style={styles.stormBadge}>
                        <AlertTriangle size={12} color="#A855F7" strokeWidth={2} />
                        <Text style={styles.stormText}>{t('aurora_active', language)}</Text>
                    </View>
                )}
            </View>

            {/* 3-column grid */}
            <View style={styles.grid}>
                {/* Current Kp */}
                <View style={styles.gridItem}>
                    <Text style={[styles.kpValue, { color: kpColor }]}>
                        {currentKp.toFixed(1)}
                    </Text>
                    <Text style={[styles.gridLabel, { color: subTextColor }]}>
                        Kp Index
                    </Text>
                    <View style={[styles.kpBadge, { backgroundColor: getKpBgColor(currentKp) }]}>
                        <Text style={[styles.kpBadgeText, { color: kpColor }]}>
                            {data.current_description}
                        </Text>
                    </View>
                </View>

                {/* Visibility */}
                <View style={styles.gridItem}>
                    <Text style={[styles.visibilityValue, { color: textColor }]}>
                        {visibilityProb}%
                    </Text>
                    <Text style={[styles.gridLabel, { color: subTextColor }]}>
                        {t('aurora_visibility', language)}
                    </Text>
                    <View style={styles.locationRow}>
                        <MapPin size={10} color={subTextColor} strokeWidth={2} />
                        <Text style={[styles.locationText, { color: subTextColor }]} numberOfLines={1}>
                            {locationName || (language === 'cs' ? 'Aktuální' : 'Current')}
                        </Text>
                    </View>
                </View>

                {/* Max forecast */}
                <View style={styles.gridItem}>
                    <View style={styles.maxRow}>
                        <TrendingUp size={14} color={subTextColor} strokeWidth={2} />
                        <Text style={[styles.maxValue, { color: getKpColor(data.max_forecast_kp ?? 0) }]}>
                            {(data.max_forecast_kp ?? 0).toFixed(1)}
                        </Text>
                    </View>
                    <Text style={[styles.gridLabel, { color: subTextColor }]}>
                        {t('aurora_max_24h', language)}
                    </Text>
                    <Text style={[styles.maxVisibility, { color: subTextColor }]}>
                        {t('aurora_max_visibility', language)}: {data.max_visibility_probability}%
                    </Text>
                </View>
            </View>

            {/* Best viewing time */}
            {data.best_viewing_time && (
                <View style={[styles.bestTimeContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Clock size={14} color={subTextColor} strokeWidth={2} />
                    <Text style={[styles.bestTimeText, { color: subTextColor }]}>
                        {t('aurora_best_time', language)}: {formatBestTime(data.best_viewing_time, timeFormat)} (Kp {data.best_viewing_kp?.toFixed(1)})
                    </Text>
                </View>
            )}

            {/* Mini forecast chart */}
            {data.forecast && data.forecast.length > 0 && (
                <View style={[styles.chartContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.chartTitle, { color: subTextColor }]}>
                        {t('aurora_3day_forecast', language)}
                    </Text>
                    <View style={styles.chartBars}>
                        {data.forecast.slice(0, 12).map((f, i) => {
                            const height = Math.max(10, (f.kp / 9) * 100);
                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.chartBar,
                                        {
                                            height: `${height}%`,
                                            backgroundColor: getKpBgColor(f.kp),
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    stormBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stormText: {
        fontSize: 12,
        color: '#A855F7',
        fontWeight: '500',
    },
    unavailableText: {
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
    },
    kpValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    gridLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    kpBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    kpBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    visibilityValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    locationText: {
        fontSize: 11,
        maxWidth: 80,
    },
    maxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    maxValue: {
        fontSize: 20,
        fontWeight: '600',
    },
    maxVisibility: {
        fontSize: 10,
        marginTop: 4,
    },
    bestTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    bestTimeText: {
        fontSize: 12,
    },
    chartContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    chartTitle: {
        fontSize: 12,
        marginBottom: 8,
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 32,
        gap: 3,
    },
    chartBar: {
        flex: 1,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        minWidth: 4,
    },
});

export default AuroraCard;
