import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, Rocket, Star, Eye } from 'lucide-react-native';
import { useSettingsStore, useSubscriptionStore } from '../stores';
import { t } from '../utils';

const { width } = Dimensions.get('window');

// Components (will be extracted later if complex)
const IssTracker = ({ data }: { data: any }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Rocket color="#FFD700" size={24} />
            <Text style={styles.cardTitle}>{t('iss_location', 'en')}</Text>
        </View>
        {data ? (
            <View>
                <Text style={styles.dataText}>Lat: {data.iss_position?.latitude}</Text>
                <Text style={styles.dataText}>Lon: {data.iss_position?.longitude}</Text>
                <Text style={styles.subText}>Next pass: calculating...</Text>
            </View>
        ) : (
            <ActivityIndicator color="#FFD700" />
        )}
    </View>
);

const MeteorShowerList = ({ data }: { data: any }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Star color="#F59E0B" size={24} />
            <Text style={styles.cardTitle}>{t('active_showers', 'en')}</Text>
        </View>
        {data && data.length > 0 ? (
            data.map((shower: any, i: number) => (
                <View key={i} style={styles.showerRow}>
                    <Text style={styles.showerName}>{shower.name}</Text>
                    <Text style={styles.showerDate}>Peak: {shower.peak_date}</Text>
                    <Text style={styles.showerZhr}>ZHR: {shower.zhr}</Text>
                </View>
            ))
        ) : (
            <Text style={styles.subText}>{t('no_showers', 'en')}</Text>
        )}
    </View>
);

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
        // Mock data for now, waiting for backend connection
        // In real impl, we will call weatherService.getAstroPack({ lat, lon })
        setLoading(true);
        setTimeout(() => {
            setAstroData({
                iss: { iss_position: { latitude: '45.0', longitude: '12.0' } },
                meteors: [
                    { name: 'Perseids', peak_date: 'Aug 12', zhr: 100 },
                    { name: 'Geminids', peak_date: 'Dec 14', zhr: 120 }
                ]
            });
            setLoading(false);
        }, 1000);
    };

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
