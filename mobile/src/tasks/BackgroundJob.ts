import BackgroundFetch from 'react-native-background-fetch';
import { notificationService } from '../services/NotificationService';
import { weatherService } from '../services/weatherService';
import { useSettingsStore, useSubscriptionStore, useLocationStore } from '../stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widgetService } from '../services/widgetService';
import { t } from '../utils/i18n';

const STORAGE_KEY_LAST_BRIEF = 'last_daily_brief_date';
const STORAGE_KEY_LAST_AURORA = 'last_aurora_alert_time';

export const initBackgroundFetch = async () => {
    const status = await BackgroundFetch.configure(
        {
            minimumFetchInterval: 15, // 15 minutes (minimum allowed on Android)
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true, // For Android headless task
            forceAlarmManager: false, // Use JobScheduler by default
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        },
        async (taskId) => {
            console.log('[BackgroundFetch] task start: ', taskId);
            await performBackgroundTask();
            BackgroundFetch.finish(taskId);
        },
        (error) => {
            console.error('[BackgroundFetch] failed to start: ', error);
        }
    );
    console.log('[BackgroundFetch] status: ', status);
};

// Logic to run in background
const performBackgroundTask = async () => {
    try {
        // We need to re-hydrate state or read form AsyncStorage directly if stores aren't ready in headless
        // But assuming the app context is somewhat alive or we use direct storage reading
        // For simplicity, let's read stores (Zustand persists to AsyncStorage, but sync might accept delay)

        // Wait for hydration if needed? 
        // Actually, let's just use the stores as they auto-hydrate.
        const { settings } = useSettingsStore.getState();
        const { tier } = useSubscriptionStore.getState();
        const { currentLocation } = useLocationStore.getState();

        // 1. Check for Pro/Ultra
        if (tier !== 'pro' && tier !== 'ultra') return;
        if (!settings.notifications_enabled) return;

        const now = new Date();
        const currentHour = now.getHours();

        // 2. Daily Brief (Morning 7-9 AM)
        if (settings.daily_brief && currentHour >= 7 && currentHour <= 10) {
            const lastBriefDate = await AsyncStorage.getItem(STORAGE_KEY_LAST_BRIEF);
            const todayStr = now.toISOString().split('T')[0];

            if (lastBriefDate !== todayStr) {
                // Send Brief
                if (currentLocation) {
                    try {
                        const brief = await weatherService.getSmartSummary({
                            location: currentLocation.name,
                            lat: currentLocation.latitude,
                            lon: currentLocation.longitude,
                            language: settings.language,
                            tier: tier,
                            include_astronomy: true
                        });

                        // Extract text from Markdown/Response? The output is usually markdown.
                        // Ideally we ask backend for a "short_text". 
                        // For now, use the first paragraph.
                        const cleanText = brief.replace(/[#*]/g, '').trim().substring(0, 200) + '...';

                        await notificationService.showDailyBrief(
                            `Daily Brief: ${currentLocation.name}`,
                            cleanText
                        );

                        await AsyncStorage.setItem(STORAGE_KEY_LAST_BRIEF, todayStr);
                    } catch (e) {
                        console.error('Failed to fetch daily brief', e);
                    }
                }
            }
        }

        // 3. Aurora Alerts (Every check)
        if (settings.aurora_alerts || settings.aurora_notifications) {
            // Check if we already alerted recently (e.g. within 6 hours)
            const lastAuroraTimeStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_AURORA);
            const lastAuroraTime = lastAuroraTimeStr ? parseInt(lastAuroraTimeStr) : 0;
            const cooldown = 6 * 60 * 60 * 1000; // 6 hours

            if (Date.now() - lastAuroraTime > cooldown) {
                if (currentLocation) {
                    try {
                        const aurora = await weatherService.getAuroraForecast(
                            currentLocation.latitude,
                            settings.language
                        );

                        // Thresholds
                        const KpThreshold = 4.0;
                        const ProbThreshold = 20;

                        if ((aurora.current_kp > KpThreshold) || (aurora.visibility_probability > ProbThreshold)) {
                            await notificationService.showAuroraAlert(
                                aurora.current_kp,
                                aurora.visibility_probability
                            );
                            await AsyncStorage.setItem(STORAGE_KEY_LAST_AURORA, Date.now().toString());
                        }
                    } catch (e) {
                        console.error('Failed to fetch aurora for background alert', e);
                    }
                }
            }
        }

        // 4. Update Widget Data
        if (currentLocation) {
            try {
                const weatherData = await weatherService.getWeatherForecast(
                    currentLocation.name,
                    7,
                    settings.language,
                    tier,
                    settings.confidence_bias || 'balanced'
                );

                if (weatherData && weatherData.current) {
                    const weatherCode = weatherData.current.weather_code || 0;
                    const localizedDesc = t(`wmo_${weatherCode}`, settings.language);
                    const themeData = (weatherData as any).ambient_theme || { is_dark: false, gradient: ['#4facfe', '#00f2fe'] };

                    await widgetService.updateWidget({
                        temperature: Math.round(weatherData.current.temperature),
                        weatherCode: weatherCode,
                        city: currentLocation.name,
                        description: localizedDesc,
                        updatedAt: Date.now(),
                        isNight: themeData.is_dark,
                        gradientStart: themeData.gradient[0] || '#4facfe',
                        gradientEnd: themeData.gradient[1] || '#00f2fe',
                        hourly: weatherData.hourly_forecast?.slice(0, 4).map(h => ({
                            time: new Date(h.time).getHours() + ':00',
                            temperature: Math.round(h.temperature),
                            weatherCode: h.weather_code || 0
                        })),
                        daily: weatherData.daily_forecast?.slice(0, 3).map(d => ({
                            date: new Date(d.date).toLocaleDateString(settings.language, { weekday: 'short' }),
                            maxTemp: Math.round(d.temperature_max),
                            minTemp: Math.round(d.temperature_min),
                            weatherCode: d.weather_code || 0
                        }))
                    });
                }
            } catch (e) {
                console.error('Failed to update background widget', e);
            }
        }

    } catch (e) {
        console.error('[BackgroundFetch] Error', e);
    }
};

// Optional: Headless Task for Android (if app is terminated)
export const headlessTask = async (taskId: string) => {
    console.log('[BackgroundFetch] Headless task start: ', taskId);
    await performBackgroundTask();
    BackgroundFetch.finish(taskId);
};
