import mobileAds, { MaxAdContentRating, RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';

class AdmobService {
    private rewardedAd: RewardedAd | null = null;
    private adLoaded: boolean = false;
    private loadingPromise: Promise<boolean> | null = null;

    async initialize() {
        try {
            await mobileAds().setRequestConfiguration({
                maxAdContentRating: MaxAdContentRating.G,
                tagForChildDirectedTreatment: true,
                tagForUnderAgeOfConsent: true,
                testDeviceIdentifiers: ['EMULATOR'],
            });

            await mobileAds().initialize();
            if (__DEV__) console.log('[AdMob] Initialized correctly.');
        } catch (error) {
            console.error('[AdMob] Initialization error:', error);
        }
    }

    loadRewardedAd(): Promise<boolean> {
        if (this.adLoaded && this.rewardedAd) {
            return Promise.resolve(true);
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8109255880447388/6679034198';

        this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        this.loadingPromise = new Promise((resolve) => {
            const unsubscribeLoaded = this.rewardedAd!.addAdEventListener(RewardedAdEventType.LOADED, () => {
                if (__DEV__) console.log('[AdMob] Rewarded Ad loaded successfully');
                this.adLoaded = true;
                this.loadingPromise = null;
                resolve(true);
            });

            const unsubscribeError = this.rewardedAd!.addAdEventListener(AdEventType.ERROR, (error) => {
                if (__DEV__) console.log('[AdMob] Ad failed to load: ', error);
                this.loadingPromise = null;
                this.adLoaded = false;
                resolve(false);
            });

            this.rewardedAd!.load();
        });

        return this.loadingPromise;
    }

    async showRewardedAd(): Promise<{ success: boolean; earnedReward: boolean }> {
        if (!this.adLoaded || !this.rewardedAd) {
            if (__DEV__) console.log('[AdMob] Ad not loaded yet. Attempting to load...');
            const loaded = await this.loadRewardedAd();
            if (!loaded) return { success: false, earnedReward: false };
        }

        return new Promise((resolve) => {
            let earned = false;
            let unsubscribeEarned: () => void;
            let unsubscribeClosed: () => void;

            const cleanup = () => {
                unsubscribeEarned?.();
                unsubscribeClosed?.();
                this.adLoaded = false;
                this.rewardedAd = null;
            };

            unsubscribeEarned = this.rewardedAd!.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                reward => {
                    if (__DEV__) console.log('[AdMob] Reward earned while showing:', reward);
                    earned = true;
                },
            );

            unsubscribeClosed = this.rewardedAd!.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    if (__DEV__) console.log('[AdMob] Ad closed by user');
                    cleanup();
                    resolve({ success: true, earnedReward: earned });
                }
            );

            try {
                this.rewardedAd!.show();
            } catch (error) {
                console.error('[AdMob] Show error:', error);
                cleanup();
                resolve({ success: false, earnedReward: false });
            }
        });
    }
}

export const admobService = new AdmobService();
