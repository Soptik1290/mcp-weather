import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, Search, ChevronRight, Navigation, AlertTriangle, CloudSun, Star, Zap, Check } from 'lucide-react-native';
import { useSettingsStore, useLocationStore } from '../stores';
import { subscriptionService } from '../services/subscriptionService';
import { notificationService } from '../services/NotificationService';
import { PurchasesPackage } from 'react-native-purchases';
import { useGeolocation } from '../hooks/useGeolocation';
import { weatherService } from '../services';
import { t, triggerHaptic, getLocalizedCity, getLocalizedCountry, type Language } from '../utils';

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
    const [step, setStep] = useState(0);
    const [selectedLang, setSelectedLang] = useState<'en' | 'cs'>(settings.language);

    const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation(selectedLang);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);

    // === Animation refs ===
    const slideAnim = useRef(new Animated.Value(0)).current;
    const iconAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;
    const sectionAnim = useRef(new Animated.Value(0)).current;
    const cardsAnim = useRef(new Animated.Value(0)).current;
    const btnAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;

    // Step 2 anims
    const step2Icon = useRef(new Animated.Value(0)).current;
    const step2Title = useRef(new Animated.Value(0)).current;
    const step2Gps = useRef(new Animated.Value(0)).current;
    const step2Search = useRef(new Animated.Value(0)).current;

    // Step 3 anims
    const step3Title = useRef(new Animated.Value(0)).current;
    const step3Cards = useRef(new Animated.Value(0)).current;
    const step3Btn = useRef(new Animated.Value(0)).current;

    // Card press scales
    const csScale = useRef(new Animated.Value(1)).current;
    const enScale = useRef(new Animated.Value(1)).current;
    const continueBtnScale = useRef(new Animated.Value(1)).current;
    const gpsBtnScale = useRef(new Animated.Value(1)).current;

    // Step 3 state
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [purchasing, setPurchasing] = useState(false);

    // Floating icon
    const iconFloat = useRef(new Animated.Value(0)).current;

    // Error shake animation
    const errorShake = useRef(new Animated.Value(0)).current;

    const lang = selectedLang;

    useEffect(() => {
        if (geoError && step === 1) {
            triggerHaptic('notificationError');
            errorShake.setValue(0);
            Animated.sequence([
                Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(errorShake, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(errorShake, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(errorShake, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }, [geoError, step, errorShake]);

    // === Entrance animation ===
    useEffect(() => {
        const stagger = (anims: Animated.Value[], delay: number = 120) => {
            anims.forEach((anim, i) => {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    delay: 200 + i * delay,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }).start();
            });
        };

        stagger([dotsAnim, iconAnim, titleAnim, subtitleAnim, sectionAnim, cardsAnim, btnAnim]);

        // Floating icon loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(iconFloat, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                Animated.timing(iconFloat, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        ).start();

        triggerHaptic('soft');
    }, []);

    const fadeStyle = (anim: Animated.Value, translateY: number = 20) => ({
        opacity: anim,
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
            }),
        }],
    });

    const animateToStep = (nextStep: number) => {
        triggerHaptic('impactMedium');

        Animated.spring(slideAnim, {
            toValue: -nextStep * SCREEN_WIDTH,
            useNativeDriver: true,
            damping: 22,
            stiffness: 85,
        }).start();
        setStep(nextStep);

        const stepAnims = nextStep === 1
            ? [step2Icon, step2Title, step2Gps, step2Search]
            : [step3Title, step3Cards, step3Btn];

        stepAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 250 + i * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }).start();
        });

        if (nextStep === 2) {
            loadPackages();
        }
    };

    const loadPackages = async () => {
        try {
            const available = await subscriptionService.getPackages();
            setPackages(available);
        } catch (err) {
            console.error('[Onboarding] Failed to load packages:', err);
        }
    };

    const handlePurchase = async (targetTier: string) => {
        triggerHaptic('impactMedium');
        setPurchasing(true);
        try {
            const pkg = packages.find(p =>
                p.product.identifier.toLowerCase().includes(targetTier) ||
                p.identifier.toLowerCase().includes(targetTier)
            );
            if (!pkg) {
                console.warn('[Onboarding] Package not found for tier:', targetTier);
                setPurchasing(false);
                return;
            }
            const success = await subscriptionService.purchasePackage(pkg);
            if (success) {
                triggerHaptic('notificationSuccess');
                finishOnboarding();
            }
        } catch (error) {
            console.error('[Onboarding] Purchase error:', error);
        } finally {
            setPurchasing(false);
        }
    };

    // === Press animations ===
    const animatePress = (scale: Animated.Value) => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 }),
        ]).start();
    };

    const handleLanguageSelect = (language: 'en' | 'cs') => {
        triggerHaptic('selection');
        animatePress(language === 'cs' ? csScale : enScale);
        setSelectedLang(language);
        updateSettings({ language });
    };

    const handleContinue = () => {
        animatePress(continueBtnScale);
        setTimeout(() => animateToStep(1), 100);
    };

    // Debounced search (matches SearchScreen pattern)
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await weatherService.searchLocation(text.trim(), selectedLang);
                setSearchResults(results.slice(0, 6));
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [selectedLang]);

    const handleSelectLocation = (location: SearchResult) => {
        triggerHaptic('notificationSuccess');
        setCurrentLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            country: location.country,
        });
        animateToStep(2);
    };

    const handleUseGPS = async () => {
        triggerHaptic('impactMedium');
        animatePress(gpsBtnScale);
        setLocating(true);
        try {
            const position = await getCurrentPosition();
            if (!position) {
                setLocating(false);
                return;
            }
            const results = await weatherService.getWeatherByCoordinates(
                position.latitude,
                position.longitude,
                1,
                selectedLang
            );
            if (results?.location) {
                triggerHaptic('notificationSuccess');
                setCurrentLocation({
                    name: results.location.name,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    country: results.location.country,
                });
                animateToStep(2);
            } else {
                setCurrentLocation({
                    name: `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`,
                    latitude: position.latitude,
                    longitude: position.longitude,
                });
                animateToStep(2);
            }
        } catch (err) {
            console.error('GPS onboarding error:', err);
            setLocating(false);
        }
    };

    const finishOnboarding = () => {
        // Request notification permission (non-blocking)
        notificationService.requestPermission().catch(() => {});
        updateSettings({ hasCompletedOnboarding: true });
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    // Result item — matches SearchScreen's renderResultItem pattern
    const renderSearchItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleSelectLocation(item)}
            activeOpacity={0.7}
        >
            <View style={styles.resultIconContainer}>
                <MapPin size={22} color="#fff" strokeWidth={1.5} />
            </View>
            <View style={styles.resultContent}>
                <Text style={styles.resultName}>
                    {getLocalizedCity(item.name, lang)}
                </Text>
                {(item.country || item.admin1) && (
                    <Text style={styles.resultSubtitle}>
                        {[item.admin1, getLocalizedCountry(item.country, lang)].filter(Boolean).join(', ')}
                    </Text>
                )}
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
    );

    const iconTranslateY = iconFloat.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#2a5298', '#4A90D9', '#67B8DE']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Progress dots */}
                    <Animated.View style={[styles.progressContainer, fadeStyle(dotsAnim, 10)]}>
                        <View style={[styles.dot, step === 0 && styles.dotActive]} />
                        <View style={[styles.dot, step === 1 && styles.dotActive]} />
                        <View style={[styles.dot, step === 2 && styles.dotActive]} />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.stepsContainer,
                            { transform: [{ translateX: slideAnim }] },
                        ]}
                    >
                        {/* ===== STEP 1: Language ===== */}
                        <View style={styles.stepPage}>
                            <View style={styles.stepContent}>
                                <Animated.View style={[fadeStyle(iconAnim, 30), { transform: [{ translateY: iconTranslateY }], alignItems: 'center' }]}>
                                    <CloudSun size={80} color="#FFF" style={{ marginBottom: 20 }} />
                                </Animated.View>

                                <Animated.Text style={[styles.welcomeTitle, fadeStyle(titleAnim)]}>
                                    {t('welcome_title', lang)}
                                </Animated.Text>
                                <Animated.Text style={[styles.welcomeSubtitle, fadeStyle(subtitleAnim)]}>
                                    {t('welcome_subtitle', lang)}
                                </Animated.Text>

                                <Animated.Text style={[styles.sectionTitle, fadeStyle(sectionAnim)]}>
                                    {t('choose_language', lang)}
                                </Animated.Text>

                                <Animated.View style={[styles.langCards, fadeStyle(cardsAnim)]}>
                                    <Animated.View style={{ flex: 1, transform: [{ scale: csScale }] }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.langCard,
                                                selectedLang === 'cs' && styles.langCardSelected,
                                            ]}
                                            onPress={() => handleLanguageSelect('cs')}
                                            activeOpacity={1}
                                        >
                                            <Text style={styles.langFlag}>🇨🇿</Text>
                                            <Text style={styles.langName}>Čeština</Text>
                                            {selectedLang === 'cs' && (
                                                <View style={styles.langCheck}>
                                                    <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>

                                    <Animated.View style={{ flex: 1, transform: [{ scale: enScale }] }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.langCard,
                                                selectedLang === 'en' && styles.langCardSelected,
                                            ]}
                                            onPress={() => handleLanguageSelect('en')}
                                            activeOpacity={1}
                                        >
                                            <Text style={styles.langFlag}>🇬🇧</Text>
                                            <Text style={styles.langName}>English</Text>
                                            {selectedLang === 'en' && (
                                                <View style={styles.langCheck}>
                                                    <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                </Animated.View>
                            </View>

                            {/* Continue button */}
                            <Animated.View style={[fadeStyle(btnAnim), { transform: [{ scale: continueBtnScale }] }]}>
                                <TouchableOpacity
                                    style={styles.continueBtn}
                                    onPress={handleContinue}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.continueBtnText}>
                                        {t('continue_btn', lang)}
                                    </Text>
                                    <ChevronRight size={20} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        {/* ===== STEP 2: Location ===== */}
                        <View style={styles.stepPage}>
                            <View style={styles.stepContent}>
                                <Animated.Text style={[styles.locationIcon, fadeStyle(step2Icon, 30)]}>
                                    📍
                                </Animated.Text>
                                <Animated.Text style={[styles.welcomeTitle, fadeStyle(step2Title)]}>
                                    {t('choose_location', lang)}
                                </Animated.Text>
                                <Animated.Text style={[styles.welcomeSubtitle, fadeStyle(step2Title)]}>
                                    {t('choose_location_subtitle', lang)}
                                </Animated.Text>

                                {/* GPS button — matches SearchScreen's geoButton pattern */}
                                <Animated.View style={[{ width: '100%', transform: [{ scale: gpsBtnScale }] }, fadeStyle(step2Gps)]}>
                                    <TouchableOpacity
                                        style={styles.geoButton}
                                        onPress={handleUseGPS}
                                        disabled={locating || geoLoading}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.geoIconContainer}>
                                            {locating || geoLoading ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Navigation size={20} color="#fff" />
                                            )}
                                        </View>
                                        <View style={styles.geoContent}>
                                            <Text style={styles.geoTitle}>
                                                {locating || geoLoading
                                                    ? t('detecting_location', lang)
                                                    : t('use_my_location', lang)}
                                            </Text>
                                            <Text style={styles.geoSubtitle}>
                                                {lang === 'cs' ? 'Automatická detekce polohy' : 'Automatic location detection'}
                                            </Text>
                                        </View>
                                        <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Divider */}
                                <Animated.View style={[styles.dividerRow, fadeStyle(step2Search)]}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>
                                        {lang === 'cs' ? 'nebo' : 'or'}
                                    </Text>
                                    <View style={styles.dividerLine} />
                                </Animated.View>

                                {/* Search — matches SearchScreen's searchContainer */}
                                {geoError && (
                                    <Animated.View style={[
                                        styles.errorContainer,
                                        fadeStyle(step2Search),
                                        { transform: [{ translateX: errorShake }] }
                                    ]}>
                                        <AlertTriangle size={18} color="#FECACA" style={{ marginBottom: 4 }} />
                                        <Text style={styles.errorText}>
                                            {geoError}
                                        </Text>
                                    </Animated.View>
                                )}

                                <Animated.View style={[styles.searchContainer, fadeStyle(step2Search), geoError ? { marginTop: 12 } : {}]}>
                                    <Search size={20} color="rgba(255,255,255,0.6)" />
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
                                </Animated.View>

                                {/* Search results */}
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                                    renderItem={renderSearchItem}
                                    style={styles.searchList}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={
                                        searchQuery.length >= 2 && !searching ? (
                                            <View style={styles.emptyContainer}>
                                                <MapPin size={40} color="rgba(255,255,255,0.3)" strokeWidth={1} />
                                                <Text style={styles.emptyText}>
                                                    {lang === 'cs' ? 'Nic nenalezeno' : 'No results'}
                                                </Text>
                                            </View>
                                        ) : null
                                    }
                                />
                            </View>
                        </View>

                        {/* ===== STEP 3: Subscription ===== */}
                        <View style={styles.stepPage}>
                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={styles.stepContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <Animated.View style={[{ alignItems: 'center' }, fadeStyle(step3Title, 30)]}>
                                    <View style={styles.planIconRow}>
                                        <Star size={36} color="#60A5FA" fill="#60A5FA" fillOpacity={0.2} />
                                        <Zap size={36} color="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                                    </View>
                                    <Text style={styles.welcomeTitle}>
                                        {t('onboarding_plans_title', lang)}
                                    </Text>
                                    <Text style={styles.welcomeSubtitle}>
                                        {t('onboarding_plans_subtitle', lang)}
                                    </Text>
                                </Animated.View>

                                {/* Pro Card */}
                                <Animated.View style={[{ width: '100%' }, fadeStyle(step3Cards)]}>
                                    <TouchableOpacity
                                        style={[styles.planCard, styles.planCardPro]}
                                        onPress={() => handlePurchase('pro')}
                                        activeOpacity={0.8}
                                        disabled={purchasing}
                                    >
                                        <View style={styles.planCardHeader}>
                                            <View>
                                                <Text style={styles.planCardTitle}>{t('pro_tier', lang)}</Text>
                                                <Text style={styles.planCardPrice}>{t('pro_price', lang)}</Text>
                                            </View>
                                            <Star size={28} color="#60A5FA" fill="#60A5FA" fillOpacity={0.2} />
                                        </View>
                                        {[t('pro_feat_1', lang), t('pro_feat_2', lang), t('pro_feat_3', lang)].map((feat, i) => (
                                            <View key={i} style={styles.planFeatureRow}>
                                                <Check size={14} color="#60A5FA" strokeWidth={3} />
                                                <Text style={styles.planFeatureText}>{feat}</Text>
                                            </View>
                                        ))}
                                        <View style={[styles.planButton, { backgroundColor: 'rgba(59, 130, 246, 0.3)' }]}>
                                            {purchasing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.planButtonText}>{t('upgrade_to', lang)} Pro</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Ultra Card */}
                                <Animated.View style={[{ width: '100%' }, fadeStyle(step3Cards)]}>
                                    <TouchableOpacity
                                        style={[styles.planCard, styles.planCardUltra]}
                                        onPress={() => handlePurchase('ultra')}
                                        activeOpacity={0.8}
                                        disabled={purchasing}
                                    >
                                        <View style={styles.planBadge}>
                                            <Text style={styles.planBadgeText}>{t('most_popular', lang)}</Text>
                                        </View>
                                        <View style={styles.planCardHeader}>
                                            <View>
                                                <Text style={styles.planCardTitle}>{t('ultra_tier', lang)}</Text>
                                                <Text style={styles.planCardPrice}>{t('ultra_price', lang)}</Text>
                                            </View>
                                            <Zap size={28} color="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                                        </View>
                                        {[t('ultra_feat_1', lang), t('ultra_feat_2', lang), t('ultra_feat_3', lang)].map((feat, i) => (
                                            <View key={i} style={styles.planFeatureRow}>
                                                <Check size={14} color="#F59E0B" strokeWidth={3} />
                                                <Text style={styles.planFeatureText}>{feat}</Text>
                                            </View>
                                        ))}
                                        <View style={[styles.planButton, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]}>
                                            {purchasing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.planButtonText}>{t('upgrade_to', lang)} Ultra</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            </ScrollView>

                            {/* Skip / Continue for free */}
                            <Animated.View style={[fadeStyle(step3Btn)]}>
                                <TouchableOpacity
                                    style={styles.skipButton}
                                    onPress={finishOnboarding}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.skipButtonText}>
                                        {t('continue_free', lang)}
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
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
        width: 28,
        borderRadius: 4,
    },
    stepsContainer: {
        flexDirection: 'row',
        flex: 1,
    },
    stepPage: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    stepContent: {
        flex: 1,
        alignItems: 'center',
    },
    appIcon: {
        fontSize: 72,
        marginBottom: 16,
        marginTop: 24,
    },
    locationIcon: {
        fontSize: 60,
        marginBottom: 16,
        marginTop: 24,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 36,
        lineHeight: 22,
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingVertical: 28,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    langCardSelected: {
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    langFlag: {
        fontSize: 40,
    },
    langName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    langCheck: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(100,200,130,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    continueBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    // GPS button — mirrors SearchScreen.geoButton
    geoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    geoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74,144,217,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    geoContent: {
        flex: 1,
    },
    geoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    geoSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
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
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    errorContainer: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.15)', // Light red bg
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginBottom: 8,
        alignItems: 'center',
    },
    errorText: {
        color: '#FECACA', // Light red text
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    // Search — mirrors SearchScreen.searchContainer
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        width: '100%',
    },
    searchInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#fff',
    },
    searchList: {
        width: '100%',
        marginTop: 10,
        maxHeight: 280,
    },
    // Result card — mirrors SearchScreen.resultCard
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        gap: 12,
    },
    resultIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    // Step 3: Subscription
    planIconRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
        marginTop: 24,
    },
    planCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    planCardPro: {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(96, 165, 250, 0.3)',
    },
    planCardUltra: {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    planCardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.3,
    },
    planCardPrice: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    planFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    planFeatureText: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    planButton: {
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    planButtonText: {
        fontWeight: '600',
        color: '#fff',
        fontSize: 15,
    },
    planBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#F59E0B',
        borderBottomLeftRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    planBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    skipButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
        textDecorationLine: 'underline',
    },
});

export default OnboardingScreen;
