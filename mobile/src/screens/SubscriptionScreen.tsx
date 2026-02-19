import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, Star, Zap, Shield, ChevronLeft } from 'lucide-react-native';
import { useSettingsStore, useSubscriptionStore, SubscriptionTier } from '../stores';
import { subscriptionService } from '../services/subscriptionService';
import { t } from '../utils';
import { CustomAlert, AlertType } from '../components/CustomAlert';
import { PurchasesPackage } from 'react-native-purchases';

const { width } = Dimensions.get('window');

export function SubscriptionScreen() {
    const navigation = useNavigation();
    const settings = useSettingsStore(state => state.settings);
    const { tier } = useSubscriptionStore();

    // State for RevenueCat packages
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info' as AlertType,
        onClose: () => setAlertVisible(false),
        buttons: undefined as any // For custom actions like "OK" on success
    });

    const showAlert = (title: string, message: string, type: AlertType = 'info', onOk?: () => void) => {
        setAlertConfig({
            title,
            message,
            type,
            onClose: () => {
                setAlertVisible(false);
                if (onOk) onOk();
            },
            buttons: onOk ? [{ text: 'OK', onPress: () => { setAlertVisible(false); onOk(); } }] : undefined
        });
        setAlertVisible(true);
    };

    // Animation refs for entry
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Load packages
        const loadPackages = async () => {
            const available = await subscriptionService.getPackages();
            setPackages(available);
            console.log('[SubscriptionScreen] Loaded packages:', available.map(p => p.identifier));
        };
        loadPackages();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const isDark = settings.theme_mode === 'dark' || settings.theme_mode === 'system';
    const backgroundColors = ['#0f172a', '#1e3a8a', '#1e40af'];

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // @ts-ignore
            navigation.navigate('Home');
        }
    };

    const handlePurchase = async (selectedTier: SubscriptionTier) => {
        if (selectedTier === tier) return;

        if (selectedTier === SubscriptionTier.Free) {
            // "Downgrade" to free is just symbolic here
            showAlert(
                t('info', settings.language),
                t('manage_subs_in_store', settings.language),
                'info'
            );
            return;
        }

        setIsLoading(true);

        try {
            // Find package matching the tier
            const pkg = packages.find(p =>
                p.product.identifier.toLowerCase().includes(selectedTier) ||
                p.identifier.toLowerCase().includes(selectedTier)
            );

            if (!pkg) {
                showAlert('Error', t('sub_error_pkg_not_found', settings.language), 'error');
                setIsLoading(false);
                return;
            }

            const success = await subscriptionService.purchasePackage(pkg);
            if (success) {
                showAlert(
                    t('sub_success_title', settings.language),
                    t('sub_success_msg', settings.language).replace('PREMIUM', selectedTier.toUpperCase()),
                    'success',
                    handleBack
                );
            }
        } catch (error) {
            console.error('Purchase failed', error);
            showAlert('Error', 'Purchase failed due to an unknown error.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            await subscriptionService.restorePurchases();
            showAlert(
                t('sub_restored_title', settings.language),
                t('sub_restored_msg', settings.language),
                'success'
            );
        } catch (error) {
            showAlert('Error', 'Failed to restore purchases.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const TierCard = ({
        targetTier,
        price,
        title,
        description,
        features,
        recommended,
        index
    }: {
        targetTier: SubscriptionTier,
        price: string,
        title: string,
        description: string,
        features: string[],
        recommended?: boolean,
        index: number
    }) => {
        const isActive = tier === targetTier;

        // Staggered animation for cards
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 150,
                useNativeDriver: true,
            }).start();
        }, []);

        const cardBg = isActive
            ? 'rgba(74, 222, 128, 0.15)' // Green tint for active
            : recommended
                ? 'rgba(245, 158, 11, 0.15)' // Amber tint for recommended
                : 'rgba(255, 255, 255, 0.05)'; // Default glass

        const borderColor = isActive
            ? '#4ade80'
            : recommended
                ? '#F59E0B'
                : 'rgba(255,255,255,0.1)';

        return (
            <Animated.View style={{
                opacity: cardAnim,
                transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }]
            }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handlePurchase(targetTier)}
                    style={[
                        styles.card,
                        { backgroundColor: cardBg, borderColor: borderColor },
                        recommended && styles.recommendedCard
                    ]}
                >
                    {recommended && (
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.recommendedBadge}
                        >
                            <Text style={styles.recommendedText}>{t('most_popular', settings.language)}</Text>
                        </LinearGradient>
                    )}

                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>{title}</Text>
                            <Text style={styles.cardPrice}>{price}</Text>
                        </View>
                        {targetTier === 'ultra' ? <Zap size={28} color="#F59E0B" fill="#F59E0B" fillOpacity={0.2} /> :
                            targetTier === 'pro' ? <Star size={28} color="#60A5FA" fill="#60A5FA" fillOpacity={0.2} /> :
                                <Shield size={28} color="#9CA3AF" />}
                    </View>

                    <Text style={styles.cardDesc}>{description}</Text>

                    <View style={styles.divider} />

                    {features.map((feat, i) => (
                        <View key={i} style={styles.miniFeatureRow}>
                            <View style={[styles.checkContainer, isActive && { backgroundColor: '#4ade80' }]}>
                                <Check size={12} color={isActive ? "#000" : "#4facfe"} strokeWidth={3} />
                            </View>
                            <Text style={styles.miniFeatureText}>{feat}</Text>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => handlePurchase(targetTier)}
                        style={[styles.button, isActive ? styles.activeButton : styles.upgradeButton]}
                    >
                        {isActive ? (
                            <Text style={[styles.buttonText, { color: '#4ade80' }]}>{t('current_plan', settings.language)}</Text>
                        ) : (
                            <LinearGradient
                                colors={recommended ? ['#F59E0B', '#D97706'] : ['#3B82F6', '#2563EB']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.buttonText}>{t('upgrade_to', settings.language)}</Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={backgroundColors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('premium_plans', settings.language)}</Text>
                        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                            <Text style={styles.restoreText}>{t('restore', settings.language) || "Restore"}</Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.ScrollView
                        contentContainerStyle={styles.scrollContent}
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                    >
                        <Text style={styles.subtitle}>{t('unlock_subtitle', settings.language)}</Text>

                        <TierCard
                            targetTier={SubscriptionTier.Free}
                            title={t('free_tier', settings.language)}
                            price={t('free_price', settings.language)}
                            description={t('free_desc', settings.language)}
                            index={0}
                            features={[
                                t('free_feat_1', settings.language),
                                t('free_feat_2', settings.language),
                                t('free_feat_3', settings.language)
                            ]}
                        />

                        <TierCard
                            targetTier={SubscriptionTier.Pro}
                            title={t('pro_tier', settings.language)}
                            price={t('pro_price', settings.language)}
                            description={t('pro_desc', settings.language)}
                            index={1}
                            features={[
                                t('pro_feat_1', settings.language),
                                t('pro_feat_2', settings.language),
                                t('pro_feat_3', settings.language),
                                t('pro_feat_4', settings.language)
                            ]}
                        />

                        <TierCard
                            targetTier={SubscriptionTier.Ultra}
                            title={t('ultra_tier', settings.language)}
                            price={t('ultra_price', settings.language)}
                            description={t('ultra_desc', settings.language)}
                            recommended={true}
                            index={2}
                            features={[
                                t('ultra_feat_1', settings.language),
                                t('ultra_feat_2', settings.language),
                                t('ultra_feat_3', settings.language),
                                t('ultra_feat_4', settings.language),
                                t('ultra_feat_5', settings.language)
                            ]}
                        />

                        <Text style={styles.disclaimer}>
                            {t('cancel_anytime', settings.language)}
                        </Text>
                        <View style={{ height: 40 }} />
                    </Animated.ScrollView>

                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#4ade80" />
                        </View>
                    )}

                    {/* Custom Alert */}
                    <CustomAlert
                        visible={alertVisible}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                        onClose={alertConfig.onClose}
                        buttons={alertConfig.buttons}
                    />
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    restoreButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    restoreText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    recommendedCard: {
        transform: [{ scale: 1.02 }],
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    recommendedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        borderBottomLeftRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    recommendedText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    cardPrice: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    cardDesc: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 20,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    miniFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    checkContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniFeatureText: {
        color: '#fff',
        fontSize: 15,
        flex: 1,
    },
    button: {
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeButton: {
        // Handled by gradient
    },
    activeButton: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderWidth: 1,
        borderColor: '#4ade80',
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    disclaimer: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
