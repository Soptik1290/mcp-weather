import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, Search, Globe, ChevronRight, Navigation } from 'lucide-react-native';
import { useSettingsStore, useLocationStore } from '../stores';
import { useGeolocation } from '../hooks/useGeolocation';
import { weatherService } from '../services';
import { t, type Language } from '../utils';

interface SearchResult {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

interface OnboardingScreenProps {
    navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
    const { settings, updateSettings } = useSettingsStore();
    const { setCurrentLocation } = useLocationStore();
    const { getCurrentPosition, loading: geoLoading } = useGeolocation();

    const [step, setStep] = useState(0); // 0 = language, 1 = location
    const [selectedLang, setSelectedLang] = useState<'en' | 'cs'>(settings.language);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const lang = selectedLang;

    const animateToStep = (nextStep: number) => {
        Animated.spring(slideAnim, {
            toValue: -nextStep * SCREEN_WIDTH,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
        }).start();
        setStep(nextStep);
    };

    const handleLanguageSelect = (language: 'en' | 'cs') => {
        setSelectedLang(language);
        updateSettings({ language });
    };

    const handleContinue = () => {
        animateToStep(1);
    };

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const results = await weatherService.searchLocation(query);
            setSearchResults(results.slice(0, 6));
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSelectLocation = (location: SearchResult) => {
        setCurrentLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            country: location.country,
        });
        finishOnboarding();
    };

    const handleUseGPS = async () => {
        setLocating(true);
        try {
            const position = await getCurrentPosition();
            if (!position) {
                setLocating(false);
                return;
            }
            // Reverse geocode to get city name
            const results = await weatherService.getWeatherByCoordinates(
                position.latitude,
                position.longitude,
                1,
                selectedLang
            );
            if (results?.location) {
                setCurrentLocation({
                    name: results.location.name,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    country: results.location.country,
                });
                finishOnboarding();
            } else {
                // Fallback: use coords directly
                setCurrentLocation({
                    name: `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`,
                    latitude: position.latitude,
                    longitude: position.longitude,
                });
                finishOnboarding();
            }
        } catch (err) {
            console.error('GPS onboarding error:', err);
            setLocating(false);
        }
    };

    const finishOnboarding = () => {
        updateSettings({ hasCompletedOnboarding: true });
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    const renderSearchItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={styles.searchItem}
            onPress={() => handleSelectLocation(item)}
            activeOpacity={0.7}
        >
            <MapPin size={18} color="rgba(255,255,255,0.6)" />
            <View style={styles.searchItemText}>
                <Text style={styles.searchItemName}>{item.name}</Text>
                {(item.country || item.admin1) && (
                    <Text style={styles.searchItemSub}>
                        {[item.admin1, item.country].filter(Boolean).join(', ')}
                    </Text>
                )}
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
    );

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#1a1a3e', '#2d2d6b', '#4a4a9a']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Progress dots */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.dot, step === 0 && styles.dotActive]} />
                        <View style={[styles.dot, step === 1 && styles.dotActive]} />
                    </View>

                    <Animated.View
                        style={[
                            styles.stepsContainer,
                            { transform: [{ translateX: slideAnim }] },
                        ]}
                    >
                        {/* ===== STEP 1: Language ===== */}
                        <View style={styles.stepPage}>
                            <View style={styles.stepContent}>
                                {/* App icon / branding */}
                                <Text style={styles.appIcon}>⛅</Text>
                                <Text style={styles.welcomeTitle}>
                                    {t('welcome_title', lang)}
                                </Text>
                                <Text style={styles.welcomeSubtitle}>
                                    {t('welcome_subtitle', lang)}
                                </Text>

                                <Text style={styles.sectionTitle}>
                                    {t('choose_language', lang)}
                                </Text>

                                {/* Language cards */}
                                <View style={styles.langCards}>
                                    <TouchableOpacity
                                        style={[
                                            styles.langCard,
                                            selectedLang === 'cs' && styles.langCardSelected,
                                        ]}
                                        onPress={() => handleLanguageSelect('cs')}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.langFlag}>🇨🇿</Text>
                                        <Text style={styles.langName}>Čeština</Text>
                                        {selectedLang === 'cs' && (
                                            <View style={styles.langCheck}>
                                                <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.langCard,
                                            selectedLang === 'en' && styles.langCardSelected,
                                        ]}
                                        onPress={() => handleLanguageSelect('en')}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.langFlag}>🇬🇧</Text>
                                        <Text style={styles.langName}>English</Text>
                                        {selectedLang === 'en' && (
                                            <View style={styles.langCheck}>
                                                <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Continue button */}
                            <TouchableOpacity
                                style={styles.continueBtn}
                                onPress={handleContinue}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueBtnText}>
                                    {t('continue_btn', lang)}
                                </Text>
                                <ChevronRight size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* ===== STEP 2: Location ===== */}
                        <View style={styles.stepPage}>
                            <View style={styles.stepContent}>
                                <Text style={styles.locationIcon}>📍</Text>
                                <Text style={styles.welcomeTitle}>
                                    {t('choose_location', lang)}
                                </Text>
                                <Text style={styles.welcomeSubtitle}>
                                    {t('choose_location_subtitle', lang)}
                                </Text>

                                {/* GPS button */}
                                <TouchableOpacity
                                    style={styles.gpsButton}
                                    onPress={handleUseGPS}
                                    disabled={locating || geoLoading}
                                    activeOpacity={0.85}
                                >
                                    {locating || geoLoading ? (
                                        <>
                                            <ActivityIndicator color="#fff" size="small" />
                                            <Text style={styles.gpsBtnText}>
                                                {t('detecting_location', lang)}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={20} color="#fff" />
                                            <Text style={styles.gpsBtnText}>
                                                {t('use_my_location', lang)}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>
                                        {lang === 'cs' ? 'nebo' : 'or'}
                                    </Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Search */}
                                <View style={styles.searchContainer}>
                                    <Search size={18} color="rgba(255,255,255,0.5)" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('search_city', lang)}
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                    {searching && (
                                        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                                    )}
                                </View>

                                {/* Search results */}
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => `${item.name}-${item.latitude}-${item.longitude}`}
                                    renderItem={renderSearchItem}
                                    style={styles.searchList}
                                    keyboardShouldPersistTaps="handled"
                                    ListEmptyComponent={
                                        searchQuery.length >= 2 && !searching ? (
                                            <Text style={styles.emptyText}>
                                                {lang === 'cs' ? 'Nic nenalezeno' : 'No results'}
                                            </Text>
                                        ) : null
                                    }
                                />
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingTop: 60,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 24,
    },
    stepsContainer: {
        flexDirection: 'row',
        flex: 1,
    },
    stepPage: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 28,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    stepContent: {
        flex: 1,
        alignItems: 'center',
    },
    appIcon: {
        fontSize: 64,
        marginBottom: 12,
        marginTop: 20,
    },
    locationIcon: {
        fontSize: 56,
        marginBottom: 12,
        marginTop: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        marginBottom: 36,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 20,
    },
    langCards: {
        flexDirection: 'row',
        gap: 14,
        width: '100%',
    },
    langCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        paddingVertical: 24,
        alignItems: 'center',
        gap: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    langCardSelected: {
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    langFlag: {
        fontSize: 36,
    },
    langName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    langCheck: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(100,200,100,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    continueBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    gpsButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(80,160,255,0.35)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(80,160,255,0.4)',
    },
    gpsBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginVertical: 20,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        gap: 10,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        height: 48,
        color: '#fff',
        fontSize: 15,
    },
    searchList: {
        width: '100%',
        marginTop: 8,
        maxHeight: 280,
    },
    searchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 6,
        gap: 12,
    },
    searchItemText: {
        flex: 1,
    },
    searchItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    searchItemSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
});

export default OnboardingScreen;
