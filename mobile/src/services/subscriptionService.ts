import { Platform } from 'react-native';
import Purchases, {
    PurchasesPackage,
    PurchasesOffering,
    LOG_LEVEL,
    CustomerInfo
} from 'react-native-purchases';
import { useSubscriptionStore, SubscriptionTier } from '../stores';
import { REVENUECAT_CONFIG } from '../config/revenueCat';

class SubscriptionService {

    /**
     * Initialize the subscription service.
     */
    async initialize(): Promise<void> {
        console.log('[SubscriptionService] Initializing RevenueCat...');

        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === 'android') {
            await Purchases.configure({ apiKey: REVENUECAT_CONFIG.API_KEY_ANDROID });
        } else if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: REVENUECAT_CONFIG.API_KEY_IOS });
        }

        // Identify anonymous user or set ID if you have authentication
        // await Purchases.logIn(userId); 

        // Initial check
        await this.checkEntitlements();

        // Listen for updates
        Purchases.addCustomerInfoUpdateListener((info) => {
            this.handleCustomerInfoUpdate(info);
        });
    }

    /**
     * Get available packages (products) from the default offering.
     */
    async getPackages(): Promise<PurchasesPackage[]> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
            return [];
        } catch (e) {
            console.error('[SubscriptionService] Error fetching offerings:', e);
            return [];
        }
    }

    /**
     * Purchase a specific package.
     */
    async purchasePackage(pack: PurchasesPackage): Promise<boolean> {
        try {
            console.log(`[SubscriptionService] Purchasing package: ${pack.identifier}`);
            const { customerInfo } = await Purchases.purchasePackage(pack);

            this.handleCustomerInfoUpdate(customerInfo);
            return true;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('[SubscriptionService] Purchase error:', e);
            }
            return false;
        }
    }

    /**
     * Restore purchases.
     */
    async restorePurchases(): Promise<void> {
        try {
            console.log('[SubscriptionService] Restoring purchases...');
            const customerInfo = await Purchases.restorePurchases();
            this.handleCustomerInfoUpdate(customerInfo);
        } catch (e) {
            console.error('[SubscriptionService] Restore error:', e);
        }
    }

    /**
     * Check current entitlements and update store.
     */
    async checkEntitlements(): Promise<void> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            this.handleCustomerInfoUpdate(customerInfo);
        } catch (e) {
            console.error('[SubscriptionService] Check entitlements error:', e);
        }
    }

    /**
     * Handle CustomerInfo updates and map entitlements to SubscriptionTier.
     */
    private handleCustomerInfoUpdate(customerInfo: CustomerInfo) {
        const store = useSubscriptionStore.getState();

        // Priority: Ultra > Pro > Free
        if (customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.ULTRA]) {
            if (store.tier !== SubscriptionTier.Ultra) {
                store.setTier(SubscriptionTier.Ultra);
                console.log('[SubscriptionService] Tier updated to ULTRA');
            }
        } else if (customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.PRO]) {
            if (store.tier !== SubscriptionTier.Pro) {
                store.setTier(SubscriptionTier.Pro);
                console.log('[SubscriptionService] Tier updated to PRO');
            }
        } else {
            // No active paid entitlement
            if (store.tier !== SubscriptionTier.Free) {
                store.setTier(SubscriptionTier.Free);
                console.log('[SubscriptionService] Tier updated to FREE');
            }
        }
    }

    /**
     * Get current tier from store.
     */
    getCurrentTier(): SubscriptionTier {
        return useSubscriptionStore.getState().tier;
    }
}

export const subscriptionService = new SubscriptionService();
