import Purchases, {
    PurchasesPackage,
    CustomerInfo,
    PurchasesOffering,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useSubscriptionStore } from '../stores';
import type { SubscriptionTier, SubscriptionInfo } from '../types';

// RevenueCat API Keys - get from RevenueCat dashboard
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key'; // TODO: Replace
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key'; // TODO: Replace

// Product identifiers
export const PRODUCT_IDS = {
    PRO_MONTHLY: 'weatherly_pro_monthly',
    PRO_YEARLY: 'weatherly_pro_yearly',
    ULTRA_MONTHLY: 'weatherly_ultra_monthly',
    ULTRA_YEARLY: 'weatherly_ultra_yearly',
};

// Entitlement identifiers
export const ENTITLEMENTS = {
    PRO: 'pro',
    ULTRA: 'ultra',
};

class SubscriptionService {
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const apiKey = Platform.OS === 'ios'
                ? REVENUECAT_API_KEY_IOS
                : REVENUECAT_API_KEY_ANDROID;

            // Skip initialization if using placeholder API keys
            if (apiKey.includes('your_') || apiKey.length < 10) {
                console.warn('RevenueCat: Skipping initialization - API key not configured');
                console.warn('RevenueCat: Set your API keys in subscriptionService.ts');
                this.initialized = true; // Mark as initialized to prevent repeated attempts
                return;
            }

            Purchases.configure({ apiKey });
            this.initialized = true;

            // Listen for customer info updates
            Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);

            // Get initial customer info
            await this.refreshSubscriptionStatus();

            console.log('RevenueCat initialized successfully');
        } catch (error) {
            console.error('RevenueCat initialization failed:', error);
            // Don't throw - app should work without subscriptions
            this.initialized = true;
        }
    }

    private handleCustomerInfoUpdate = (info: CustomerInfo) => {
        const subscriptionInfo = this.parseCustomerInfo(info);
        useSubscriptionStore.getState().setSubscription(subscriptionInfo);
    };

    private parseCustomerInfo(info: CustomerInfo): SubscriptionInfo {
        const hasUltra = info.entitlements.active[ENTITLEMENTS.ULTRA] !== undefined;
        const hasPro = info.entitlements.active[ENTITLEMENTS.PRO] !== undefined;

        let tier: SubscriptionTier = 'free';
        let expiresAt: string | undefined;
        let willRenew = false;

        if (hasUltra) {
            tier = 'ultra';
            const entitlement = info.entitlements.active[ENTITLEMENTS.ULTRA];
            expiresAt = entitlement?.expirationDate ?? undefined;
            willRenew = entitlement?.willRenew ?? false;
        } else if (hasPro) {
            tier = 'pro';
            const entitlement = info.entitlements.active[ENTITLEMENTS.PRO];
            expiresAt = entitlement?.expirationDate ?? undefined;
            willRenew = entitlement?.willRenew ?? false;
        }

        return {
            tier,
            is_active: tier !== 'free',
            expires_at: expiresAt,
            will_renew: willRenew,
        };
    }

    async refreshSubscriptionStatus(): Promise<SubscriptionInfo> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const subscriptionInfo = this.parseCustomerInfo(customerInfo);
            useSubscriptionStore.getState().setSubscription(subscriptionInfo);
            return subscriptionInfo;
        } catch (error) {
            console.error('Failed to refresh subscription:', error);
            return {
                tier: 'free',
                is_active: false,
                will_renew: false,
            };
        }
    }

    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error('Failed to get offerings:', error);
            return null;
        }
    }

    async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            const subscriptionInfo = this.parseCustomerInfo(customerInfo);
            useSubscriptionStore.getState().setSubscription(subscriptionInfo);
            return true;
        } catch (error: any) {
            if (error.userCancelled) {
                console.log('User cancelled purchase');
                return false;
            }
            console.error('Purchase failed:', error);
            throw error;
        }
    }

    async restorePurchases(): Promise<SubscriptionInfo> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            const subscriptionInfo = this.parseCustomerInfo(customerInfo);
            useSubscriptionStore.getState().setSubscription(subscriptionInfo);
            return subscriptionInfo;
        } catch (error) {
            console.error('Restore purchases failed:', error);
            throw error;
        }
    }

    async setUserId(userId: string): Promise<void> {
        try {
            await Purchases.logIn(userId);
        } catch (error) {
            console.error('Failed to set user ID:', error);
        }
    }

    async logout(): Promise<void> {
        try {
            await Purchases.logOut();
            useSubscriptionStore.getState().setSubscription({
                tier: 'free',
                is_active: false,
                will_renew: false,
            });
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
