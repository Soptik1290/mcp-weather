import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, Rocket, Star, Eye } from 'lucide-react-native';
import { useSettingsStore, useSubscriptionStore } from '../stores';
import { weatherService } from '../services';
import { t } from '../utils';

const { width } = Dimensions.get('window');

// Components (will be extracted later if complex)
const IssTracker = ({ data }: { data: any }) => {
    const settings = useSettingsStore(state => state.settings);
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Rocket color="#FFD700" size={24} />
                <Text style={styles.cardTitle}>{t('iss_location', settings.language)}</Text>
            </View>
            {data ? (
                <View>
                    <Text style={styles.dataText}>Lat: {data.iss_position?.latitude}</Text>
                    <Text style={styles.dataText}>Lon: {data.iss_position?.longitude}</Text>
                    <Text style={styles.subText}>{t('next_pass', settings.language)}: {t('calculating', settings.language)}</Text>
                </View>
            ) : (
                <ActivityIndicator color="#FFD700" />
            )}
        </View>
    );
};

const MeteorShowerList = ({ data }: { data: any }) => {
    const settings = useSettingsStore(state => state.settings);
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Star color="#F59E0B" size={24} />
                <Text style={styles.cardTitle}>{t('active_showers', settings.language)}</Text>
            </View>
            {data && data.length > 0 ? (
                data.map((shower: any, i: number) => (
                    <View key={i} style={styles.showerRow}>
                        <Text style={styles.showerName}>{shower.name}</Text>
                        <Text style={styles.showerDate}>{t('peak', settings.language)}: {shower.peak_date}</Text>
                        <Text style={styles.showerZhr}>{t('zhr', settings.language)}: {shower.zhr}</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.subText}>{t('no_showers', settings.language)}</Text>
            )}
        </View>
    );
};

export const AstroPackScreen = () => {
    const navigation = useNavigation();
    const settings = useSettingsStore(state => state.settings);
    const { tier } = useSubscriptionStore();
    const [loading, setLoading] = useState(true);
    const [astroData, setAstroData] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Default to Prague if no location, or last known
            const lat = 50.0755;
            const lon = 14.4378;

            const data = await weatherService.getAstroPack(lat, lon, settings.language);
            setAstroData(data);
        } catch (error) {
            console.error('Failed to load AstroPack', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh ISS position every 10s if screen is focused
    useEffect(() => {
        const interval = setInterval(async () => {
            // Only update if we already have data (silent update)
            if (astroData) {
                try {
                    const lat = 50.0755;
                    const lon = 14.4378;
                    const newData = await weatherService.getAstroPack(lat, lon, settings.language);
                    setAstroData((prev: any) => ({
                        ...prev,
                        iss: newData.iss
                    }));
                } catch (e) {/* ignore silent update error */ }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [astroData]);

    if (tier !== 'ultra') {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Ultra Only</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#312e81']} // Deep space blue/purple
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('astro_pack', settings.language)}</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <IssTracker data={astroData?.iss} />
                        <MeteorShowerList data={astroData?.meteors} />
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    dataText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 4,
    },
    subText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    showerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 8,
    },
    showerName: { color: 'white', fontWeight: 'bold' },
    showerDate: { color: '#F59E0B' },
    showerZhr: { color: 'rgba(255,255,255,0.7)' },
});
