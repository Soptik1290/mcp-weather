import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

class NotificationService {
    constructor() {
        this.createChannels();
    }

    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        }
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1;
    }

    async createChannels() {
        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: 'daily_brief',
                name: 'Daily Briefing (AI)',
                importance: AndroidImportance.HIGH,
                description: 'Morning AI summary of the weather',
            });
            await notifee.createChannel({
                id: 'aurora_alerts',
                name: 'Aurora Alerts (Pro)',
                importance: AndroidImportance.HIGH,
                description: 'Real-time alerts when Aurora is visible',
            });
            await notifee.createChannel({
                id: 'astro_alerts',
                name: 'Astronomy Alerts (Ultra)',
                importance: AndroidImportance.HIGH,
                description: 'Notifications for rare astronomical events like eclipses',
            });
        }
    }

    async showDailyBrief(title: string, body: string) {
        await this.createChannels(); // Ensure channel exists
        await notifee.displayNotification({
            title: title || 'Good Morning! ☀️',
            body: body,
            android: {
                channelId: 'daily_brief',
                smallIcon: 'ic_launcher', // Ensure this exists or use default
                pressAction: {
                    id: 'default',
                },
                style: { type: AndroidStyle.BIGTEXT, text: body }, // Expandable
            },
        });
    }

    async showAuroraAlert(kp: number, probability: number) {
        await this.createChannels();
        await notifee.displayNotification({
            title: `Aurora Alert! 🌌 (Kp ${kp.toFixed(1)})`,
            body: `High probability (${probability}%) of seeing the Aurora right now!`,
            android: {
                channelId: 'aurora_alerts',
                smallIcon: 'ic_launcher',
                pressAction: {
                    id: 'default',
                },
                color: '#A78BFA',
            },
        });
    }

    async showEclipseAlert(type: 'solar' | 'lunar', timeStr: string) {
        await this.createChannels();
        const emoji = type === 'solar' ? '☀️' : '🌕';
        const title = type === 'solar' ? 'Solar Eclipse!' : 'Lunar Eclipse!';
        await notifee.displayNotification({
            title: `${title} ${emoji}`,
            body: `An eclipse is happening soon! (${new Date(timeStr).toLocaleTimeString()})`,
            android: {
                channelId: 'astro_alerts',
                smallIcon: 'ic_launcher',
                pressAction: {
                    id: 'default',
                },
                color: type === 'solar' ? '#FBBF24' : '#9CA3AF',
            },
        });
    }
}

export const notificationService = new NotificationService();
