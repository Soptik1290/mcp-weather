import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore, useSubscriptionStore } from '../stores';
import { widgetService } from '../services/widgetService';
import { t } from '../utils';

// Simple color presets
const COLOR_PRESETS = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#D97706', '#059669', '#0f172a', '#000000',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#64748b', '#6b7280', '#71717a', '#737373', '#78716c', '#ffffff'
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

    const saveConfig = () => {
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
                        <Text style={styles.headerTitle}>{t('customize_widget')}</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Preview (Mock) */}
                        <View style={styles.previewContainer}>
                            <Text style={styles.sectionTitle}>{t('widget_preview')}</Text>
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
                            <Text style={styles.sectionTitle}>{t('widget_theme')}</Text>
                            <View style={styles.row}>
                                {[
                                    { key: 'auto', label: t('theme_option_auto') },
                                    { key: 'light', label: t('theme_option_light') },
                                    { key: 'dark', label: t('theme_option_dark') },
                                    { key: 'custom', label: t('theme_option_custom') }
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => setThemeMode(item.key as any)}
                                        style={[
                                            styles.optionBtn,
                                            themeMode === item.key && styles.optionBtnActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            themeMode === item.key && styles.optionTextActive
                                        ]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Custom Color Picker */}
                        {themeMode === 'custom' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('widget_background_color')}</Text>
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

                        {/* Opacity Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('widget_opacity')}: {Math.round(opacity / 2.55)}%</Text>
                            <View style={styles.row}>
                                {[0, 25, 50, 75, 100].map(pct => (
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

                        <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
                            <Text style={styles.saveButtonText}>{t('widget_save')}</Text>
                        </TouchableOpacity>

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
    saveButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
