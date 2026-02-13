
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rocket, Star } from 'lucide-react-native';
import { t } from '../utils';

interface AstroCardProps {
    data: any;
    textColor: string;
    subTextColor: string;
    cardBg: string;
    isDark: boolean;
    language: string;
}

export function AstroCard({ data, textColor, subTextColor, cardBg, isDark, language }: AstroCardProps) {
    if (!data) return null;

    const { iss, meteors } = data;

    return (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
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
