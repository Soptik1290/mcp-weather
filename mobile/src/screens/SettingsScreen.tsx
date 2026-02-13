import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Linking,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
    X,
    Globe,
    Thermometer,
    Clock,
    Bell,
    Sparkles,
    Palette,
    Vibrate,
    Info,
    ChevronRight,
    Check,
    Github,
    FileText,
    Layout
} from 'lucide-react-native';
import { useSettingsStore, useSubscriptionStore } from '../stores';
import { t } from '../utils';

interface SettingsScreenProps {
    onClose: () => void;
    themeGradient: string[];
    isDark: boolean;
}

type OptionValue = string | boolean;

interface SettingOption {
    label: string;
    value: OptionValue;
}

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

interface SettingsScreenProps {
    onClose: () => void;
    themeGradient: string[];
    isDark: boolean;
}

export function SettingsScreen({ onClose, themeGradient, isDark }: SettingsScreenProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { settings, updateSettings } = useSettingsStore();
    const { tier } = useSubscriptionStore();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const lang = settings.language;

    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    const cardBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
    const activeBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    const toggleSection = (key: string) => {
        setExpandedSection(expandedSection === key ? null : key);
    };

    const renderOptionRow = (
        label: string,
        options: SettingOption[],
        currentValue: OptionValue,
        onSelect: (value: any) => void,
        sectionKey: string,
        IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>,
        iconColor: string,
        description?: string
    ) => {
        const isExpanded = expandedSection === sectionKey;
        const currentLabel = options.find(o => o.value === currentValue)?.label || String(currentValue);

        return (
            <View key={sectionKey}>
                <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => toggleSection(sectionKey)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                        <IconComponent size={20} color={iconColor} strokeWidth={2} />
                    </View>
                    <View style={styles.settingContent}>
                        <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
                        {description && (
                            <Text style={[styles.settingDescription, { color: subTextColor }]}>{description}</Text>
                        )}
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={[styles.currentValue, { color: subTextColor }]}>{currentLabel}</Text>
                        <ChevronRight
                            size={16}
                            color={subTextColor}
                            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={[styles.optionsContainer, { backgroundColor: activeBg }]}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={String(option.value)}
                                style={styles.optionRow}
                                onPress={() => onSelect(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    { color: textColor },
                                    currentValue === option.value && styles.optionLabelActive,
                                ]}>
                                    {option.label}
                                </Text>
                                {currentValue === option.value && (
                                    <Check size={18} color="#4A90D9" strokeWidth={2.5} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderToggle = (
        label: string,
        value: boolean,
        onToggle: (val: boolean) => void,
        IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>,
        iconColor: string,
        description?: string
    ) => (
        <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                <IconComponent size={20} color={iconColor} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
                {description && (
                    <Text style={[styles.settingDescription, { color: subTextColor }]}>{description}</Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: 'rgba(128,128,128,0.3)', true: '#4A90D9' }}
                thumbColor="#fff"
            />
        </View>
    );

    return (
        <LinearGradient
            colors={themeGradient}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft} />
                    <Text style={[styles.headerTitle, { color: textColor }]}>
                        {t('settings', lang)}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: cardBg }]}
                    >
                        <X size={22} color={textColor} strokeWidth={2} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Premium Settings */}
                    <TouchableOpacity
                        style={[styles.premiumCard, { borderColor: '#F59E0B', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }]}
                        onPress={() => (navigation as any).navigate('Subscription')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.premiumHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                                <Sparkles size={20} color="#fff" fill="#fff" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingLabel, { color: textColor }]}>
                                    Weatherly Premium
                                </Text>
                                <Text style={[styles.settingDescription, { color: subTextColor }]}>
                                    Unlock 5-Mini, Widgets & More
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#F59E0B" />
                        </View>
                    </TouchableOpacity>

                    {/* General Settings */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        {t('general', lang)}
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderOptionRow(
                            t('language', lang),
                            [
                                { label: '🇨🇿 Čeština', value: 'cs' },
                                { label: '🇬🇧 English', value: 'en' },
                            ],
                            settings.language,
                            (val) => updateSettings({ language: val }),
                            'language',
                            Globe,
                            '#4A90D9',
                            t('language_desc', lang)
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => (navigation as any).navigate('WidgetConfig')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                                <Palette size={20} color="#3B82F6" strokeWidth={2} />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingLabel, { color: textColor }]}>Widget Settings</Text>
                                <Text style={[styles.settingDescription, { color: subTextColor }]}>
                                    Customize appearance
                                </Text>
                            </View>
                            <ChevronRight size={16} color={subTextColor} />
                        </TouchableOpacity>

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderOptionRow(
                            t('temperature', lang),
                            [
                                { label: t('celsius', lang), value: 'celsius' },
                                { label: t('fahrenheit', lang), value: 'fahrenheit' },
                            ],
                            settings.temperature_unit,
                            (val) => updateSettings({ temperature_unit: val }),
                            'temperature',
                            Thermometer,
                            '#FF6B6B',
                            t('temp_desc', lang)
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderOptionRow(
                            t('settings_time_format', lang), // Assuming key might differ, but keeping original logic
                            [
                                { label: t('time_24h', lang), value: '24h' },
                                { label: t('time_12h', lang), value: '12h' },
                            ],
                            settings.time_format,
                            (val) => updateSettings({ time_format: val }),
                            'timeFormat',
                            Clock,
                            '#F59E0B',
                            t('time_format_desc', lang)
                        )}
                    </View>

                    {/* Notifications */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        {t('notifications_section', lang)}
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderToggle(
                            t('notifications', lang),
                            settings.notifications_enabled,
                            (val) => updateSettings({ notifications_enabled: val }),
                            Bell,
                            '#FBBF24',
                            t('notifications_desc', lang)
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderToggle(
                            t('aurora', lang),
                            settings.aurora_alerts,
                            (val) => updateSettings({ aurora_alerts: val }),
                            Sparkles,
                            '#A78BFA',
                            t('aurora_alerts_desc', lang)
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderToggle(
                            t('vibration', lang),
                            settings.haptic_enabled,
                            (val) => updateSettings({ haptic_enabled: val }),
                            Vibrate,
                            '#F97316',
                            t('haptic_desc', lang)
                        )}
                    </View>

                    {/* AI Settings (Ultra Only) */}
                    {tier === 'ultra' && (
                        <>
                            <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                                {t('ai_section', lang)}
                            </Text>
                            <View style={[styles.card, { backgroundColor: cardBg }]}>
                                {renderOptionRow(
                                    t('forecast_style', lang),
                                    [
                                        { label: t('cautious', lang), value: 'cautious' },
                                        { label: t('balanced', lang), value: 'balanced' },
                                        { label: t('optimistic', lang), value: 'optimistic' },
                                    ],
                                    settings.confidence_bias,
                                    (val) => updateSettings({ confidence_bias: val }),
                                    'confidence',
                                    Sparkles,
                                    '#10B981',
                                    t('confidence_desc', lang)
                                )}
                            </View>
                        </>
                    )}

                    {/* Notifications (Pro) */}
                    {(tier === 'pro' || tier === 'ultra') && (
                        <>
                            <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                                {t('notifications', lang)}
                            </Text>
                            <View style={[styles.card, { backgroundColor: cardBg }]}>
                                {renderToggle(
                                    t('aurora_alerts', lang),
                                    settings.aurora_notifications,
                                    (val) => updateSettings({ aurora_notifications: val }),
                                    Bell,
                                    '#F59E0B'
                                )}
                                <View style={styles.divider} />
                                {renderToggle(
                                    t('daily_brief', lang),
                                    settings.daily_brief,
                                    (val) => updateSettings({ daily_brief: val }),
                                    FileText,
                                    '#3B82F6'
                                )}
                            </View>

                            <Text style={[styles.sectionHeader, { color: subTextColor, marginTop: 24 }]}>
                                {t('widgets', lang)}
                            </Text>
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: cardBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }]}
                                onPress={() => navigation.navigate('WidgetConfig')}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Layout size={24} color="#A78BFA" />
                                    <Text style={{ color: textColor, fontSize: 16, fontWeight: '500' }}>
                                        {t('customize_widget', lang)}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={subTextColor} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Aurora Display */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        {t('aurora_section', lang)}
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderOptionRow(
                            t('aurora_setting', lang),
                            [
                                { label: t('aurora_auto', lang), value: 'auto' },
                                { label: t('aurora_always', lang), value: 'always' },
                                { label: t('aurora_never', lang), value: 'never' },
                            ],
                            settings.aurora_display,
                            (val) => updateSettings({ aurora_display: val }),
                            'auroraDisplay',
                            Sparkles,
                            '#A78BFA',
                            t('aurora_setting_desc', lang)
                        )}
                    </View>

                    {/* Theme Mode */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        {t('theme_section', lang)}
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderOptionRow(
                            t('theme_mode', lang),
                            [
                                { label: t('theme_auto', lang), value: 'auto' },
                                { label: t('theme_system', lang), value: 'system' },
                                { label: t('theme_dark', lang), value: 'dark' },
                                { label: t('theme_light', lang), value: 'light' },
                            ],
                            settings.theme_mode,
                            (val) => updateSettings({ theme_mode: val }),
                            'themeMode',
                            Palette,
                            '#F472B6',
                            t('theme_mode_desc', lang)
                        )}
                    </View>

                    {/* About */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        {t('about_section', lang)}
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.settingRow}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(74,144,217,0.2)' }]}>
                                <Info size={20} color="#4A90D9" strokeWidth={2} />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingLabel, { color: textColor }]}>Weatherly AI</Text>
                                <Text style={[styles.settingDescription, { color: subTextColor }]}>
                                    {t('about_desc', lang)}
                                </Text>
                            </View>
                            <Text style={[styles.version, { color: subTextColor }]}>v1.0.0</Text>
                        </View>

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => Linking.openURL('https://github.com/Soptik1290/mcp-weather')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(128,128,128,0.2)' }]}>
                                <Github size={20} color={textColor} strokeWidth={2} />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingLabel, { color: textColor }]}>GitHub</Text>
                                <Text style={[styles.settingDescription, { color: subTextColor }]}>
                                    {t('view_source', lang)}
                                </Text>
                            </View>
                            <ChevronRight size={16} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: subTextColor }]}>
                            Made with ❤️ by Soptik1290
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        width: 44,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 10,
        borderRadius: 12,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 24,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    premiumCard: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        overflow: 'hidden',
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    currentValue: {
        fontSize: 14,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 62,
    },
    optionsContainer: {
        marginHorizontal: 14,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    optionLabel: {
        fontSize: 15,
    },
    optionLabelActive: {
        fontWeight: '600',
    },
    version: {
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(128,128,128,0.2)',
        marginVertical: 8,
    },
});

export default SettingsScreen;
