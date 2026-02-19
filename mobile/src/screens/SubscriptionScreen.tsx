import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore, SubscriptionTier } from '../stores';
import { subscriptionService } from '../services/SubscriptionService';

export function SubscriptionScreen() {
    const navigation = useNavigation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Ensure SDK is configured before showing Paywall
        const init = async () => {
            try {
                // If not already configured, it might be in App.tsx or we force init here
                // subscriptionService.initialize() is called in App.tsx usually.
                // We check if we can get offerings to verify readiness
                await Purchases.getOfferings();
                setIsReady(true);
            } catch (e) {
                console.error("Paywall init error:", e);
                // Fallback or retry logic could go here
                setIsReady(true); // Try showing anyway or show error
            }
        };
        init();
    }, []);

    const onPurchaseCompleted = ({ customerInfo, productIdentifier }: any) => {
        console.log("Purchase completed:", productIdentifier);
        // Store update is handled by the listener in SubscriptionService, 
        // but we can force a check or navigation here.
        navigation.goBack();
    };

    const onRestoreCompleted = ({ customerInfo }: any) => {
        console.log("Restore completed");
        Alert.alert("Restore Successful", "Your purchases have been restored.");
    };

    if (!isReady) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <RevenueCatUI.Paywall
                onPurchaseCompleted={onPurchaseCompleted}
                onRestoreCompleted={onRestoreCompleted}
                onDismiss={() => navigation.goBack()}
                options={{
                    fontFamily: "System"
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
