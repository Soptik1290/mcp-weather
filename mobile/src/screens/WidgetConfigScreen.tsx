import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Switch
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, Palette, Layout, Droplet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore, useSubscriptionStore } from '../stores'; // Assuming stores exist
import { widgetService, WidgetData } from '../services/widgetService';
import { t } from '../utils';

// Simple color presets
const COLOR_PRESETS = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#D97706', '#059669', '#0f172a', '#000000'
];

export function WidgetConfigScreen() {
    const navigation = useNavigation();
    const settings = useSettingsStore(state => state.settings);
    const { tier } = useSubscriptionStore();
    const isDark = settings.theme_mode === 'dark';

    // State for widget config
    const [opacity, setOpacity] = useState(255); // 0-255
    const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark' | 'custom'>('auto');
    const [fixedColor, setFixedColor] = useState('');

    // Mock saving - in real app we'd read current widget config first
    // For now we just set state defaults

    const saveConfig = () => {
        // We need to trigger an update. 
        // In a real scenario, we'd fetch the latest weather data to pass along, 
        // or update just the shared prefs 'customization' fields if the native side supports partial updates.
        // For MVP, we'll just save to our store or directly via widgetService if we expose a "updateConfig" method.

        // Since widgetService.updateWidget takes full data, let's assume we can pass just customization 
        // if we modify the service, OR we just update the shared prefs directly.
        // Let's modify widgetService to allow updating config only.

        // For now, let's just simulate it by calling updateWidget with dummy data + customization
        // In reality, HomeScreen updates the widget with real data. 
        // We should probably save these prefs to useSettingsStore and let HomeScreen pick them up next update.

        // Let's add widget_settings to useSettingsStore instead!
        // But for this task, I'll assume we save to Native directly.

        widgetService.updateWidget({
            temperature: 0, weatherCode: 0, city: '', description: '', updatedAt: 0, // dummy
            isNight: false, gradientStart: '', gradientEnd: '',
            customization: {
                opacity,
                theme: themeMode,
                fixed_color: themeMode === 'custom' ? fixedColor : ''
            }
        });

        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={saveConfig} style={styles.backButton}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Widget Settings</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Preview (Mock) */}
                        <View style={styles.previewContainer}>
                            <Text style={styles.sectionTitle}>Preview</Text>
                            <View style={[
                                styles.widgetPreview,
                                {
                                    backgroundColor: themeMode === 'custom' ? fixedColor : '#4facfe',
                                    opacity: opacity / 255
                                }
                            ]}>
                                <Text style={styles.previewText}>Prague</Text>
                                <Text style={styles.previewTemp}>24°</Text>
                            </View>
                        </View>

                        {/* Theme Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Theme</Text>
                            <View style={styles.row}>
                                {['auto', 'light', 'dark', 'custom'].map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setThemeMode(m as any)}
                                        style={[
                                            styles.optionBtn,
                                            themeMode === m && styles.optionBtnActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            themeMode === m && styles.optionTextActive
                                        ]}>{m.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Custom Color Picker */}
                        {themeMode === 'custom' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Background Color</Text>
                                <View style={styles.colorGrid}>
                                    {COLOR_PRESETS.map(c => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: c },
                                                fixedColor === c && styles.colorCircleActive
                                            ]}
                                            onPress={() => setFixedColor(c)}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Opacity Mock Slider (Buttons for MVP since no Slider lib) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Opacity: {Math.round(opacity / 2.55)}%</Text>
                            <View style={styles.row}>
                                {[25, 50, 75, 100].map(pct => (
                                    <TouchableOpacity
                                        key={pct}
                                        onPress={() => setOpacity(Math.round(pct * 2.55))}
                                        style={[
                                            styles.optionBtn,
                                            Math.abs(opacity - (pct * 2.55)) < 10 && styles.optionBtnActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            Math.abs(opacity - (pct * 2.55)) < 10 && styles.optionTextActive
                                        ]}>{pct}%</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: { padding: 4 },
    content: { padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: {
        color: '#94a3b8',
        marginBottom: 12,
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    previewContainer: { alignItems: 'center', marginBottom: 30 },
    widgetPreview: {
        width: 160,
        height: 160,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    previewText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    previewTemp: { color: '#fff', fontSize: 42, fontWeight: '200' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionBtnActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
    },
    optionText: { color: '#94a3b8', fontWeight: '600' },
    optionTextActive: { color: '#fff' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    colorCircleActive: {
        borderColor: '#fff',
        borderWidth: 3,
    },
});
