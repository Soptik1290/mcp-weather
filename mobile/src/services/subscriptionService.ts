import { useSubscriptionStore, SubscriptionTier } from '../stores';

/**
 * Service to handle subscription purchases and status checks.
 * Currently a mock implementation that updates the local store.
 */
class SubscriptionService {

    // Mock prices
    static PRICES = {
        free: 'Free',
        pro: '€4.99 / year',
        ultra: '€9.99 / year'
    };

    /**
     * Initialize the subscription service.
     */
    async initialize(): Promise<void> {
        console.log('[SubscriptionService] Initializing...');
        // In a real app, check for valid subscription here
        await this.restorePurchases();
    }

    /**
     * Simulate a purchase flow.
     * In a real app, this would integrate with RevenueCat or native IAP.
     */
    async purchaseSubscription(tier: SubscriptionTier): Promise<boolean> {
        console.log(`[SubscriptionService] Purchasing ${tier}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update local store
        const store = useSubscriptionStore.getState();
        store.setTier(tier);

        console.log(`[SubscriptionService] Purchase successful. New tier: ${tier}`);
        return true;
    }

    /**
     * Restore purchases.
     */
    async restorePurchases(): Promise<void> {
        console.log('[SubscriptionService] Restoring purchases...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock restore: do nothing or set to a default for testing
        console.log('[SubscriptionService] Restore complete.');
    }

    /**
     * Get current tier from store.
     */
    getCurrentTier(): SubscriptionTier {
        return useSubscriptionStore.getState().tier;
    }
}

export const subscriptionService = new SubscriptionService();
