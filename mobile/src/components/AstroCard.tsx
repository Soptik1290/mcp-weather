
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions
} from 'react-native';
import { Rocket, Star, Sun, Moon } from 'lucide-react-native';
import { t, Language } from '../utils';

interface AstroCardProps {
    data: any;
    textColor: string;
    subTextColor: string;
    cardBg: string;
    isDark: boolean;
    language: Language;
}

export function AstroCard({ data, textColor, subTextColor, cardBg, isDark, language = 'cs' }: AstroCardProps) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    if (!data) return null;

    const { iss, meteors } = data;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: cardBg,
                padding: isTablet ? 24 : 16,
                borderRadius: isTablet ? 24 : 20
            }
        ]}>
            <View style={styles.header}>
                <Rocket size={20} color="#A78BFA" />
                <Text style={[styles.title, { color: textColor }]}>{t('astro_pack', language)}</Text>
            </View>

            {iss && (
                <View style={styles.section}>
                    <Text style={[styles.label, { color: subTextColor }]}>{t('iss_location', language)}</Text>
                    <Text style={[styles.value, { color: textColor }]}>
                        {iss.latitude.toFixed(2)}, {iss.longitude.toFixed(2)}
                    </Text>
                </View>
            )}

            <View style={styles.divider} />

            {meteors && meteors.length > 0 ? (
                <View style={styles.section}>
                    <Text style={[styles.label, { color: subTextColor }]}>{t('active_showers', language)}</Text>
                    {meteors.map((m: any, i: number) => (
                        <View key={i} style={styles.meteorRow}>
                            <Star size={14} color="#F59E0B" />
                            <Text style={[styles.meteorName, { color: textColor }]}>{m.name}</Text>
                            <Text style={[styles.meteorStatus, { color: m.status === 'peak' ? '#EF4444' : subTextColor }]}>
                                {m.status}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={[styles.label, { color: subTextColor }]}>{t('no_showers', language)}</Text>
            )}

            {data.eclipses && (data.eclipses.solar || data.eclipses.lunar) && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: subTextColor }]}>{t('next_eclipses', language)}</Text>
                        {data.eclipses.solar && (
                            <View style={styles.meteorRow}>
                                <Sun size={14} color="#FBBF24" />
                                <Text style={[styles.meteorName, { color: textColor }]}>{t('solar_eclipse', language)}</Text>
                                <Text style={[styles.meteorStatus, { color: textColor }]}>
                                    {new Date(data.eclipses.solar).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US')}
                                </Text>
                            </View>
                        )}
                        {data.eclipses.lunar && (
                            <View style={styles.meteorRow}>
                                <Moon size={14} color="#9CA3AF" />
                                <Text style={[styles.meteorName, { color: textColor }]}>{t('lunar_eclipse', language)}</Text>
                                <Text style={[styles.meteorStatus, { color: textColor }]}>
                                    {new Date(data.eclipses.lunar).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US')}
                                </Text>
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(128,128,128,0.2)',
        marginVertical: 12,
    },
    meteorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    meteorName: {
        fontWeight: '500',
        fontSize: 14,
    },
    meteorStatus: {
        fontSize: 12,
        textTransform: 'capitalize',
        marginLeft: 'auto'
    }
});
