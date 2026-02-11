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
    Bell,
    Sparkles,
    Info,
    ChevronRight,
    Check,
    Github,
} from 'lucide-react-native';
import { useSettingsStore } from '../stores';

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

export function SettingsScreen({ onClose, themeGradient, isDark }: SettingsScreenProps) {
    const { settings, updateSettings } = useSettingsStore();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
                        Nastavení
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
                    {/* General Settings */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        OBECNÉ
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderOptionRow(
                            'Jazyk',
                            [
                                { label: '🇨🇿 Čeština', value: 'cs' },
                                { label: '🇬🇧 English', value: 'en' },
                            ],
                            settings.language,
                            (val) => updateSettings({ language: val }),
                            'language',
                            Globe,
                            '#4A90D9',
                            'Jazyk aplikace a předpovědí'
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderOptionRow(
                            'Jednotky teploty',
                            [
                                { label: '°C Celsius', value: 'celsius' },
                                { label: '°F Fahrenheit', value: 'fahrenheit' },
                            ],
                            settings.temperature_unit,
                            (val) => updateSettings({ temperature_unit: val }),
                            'temperature',
                            Thermometer,
                            '#FF6B6B',
                            'Jednotky zobrazení teploty'
                        )}
                    </View>

                    {/* Notifications */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        UPOZORNĚNÍ
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderToggle(
                            'Upozornění',
                            settings.notifications_enabled,
                            (val) => updateSettings({ notifications_enabled: val }),
                            Bell,
                            '#FBBF24',
                            'Push notifikace o počasí'
                        )}

                        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                        {renderToggle(
                            'Polární záře',
                            settings.aurora_alerts,
                            (val) => updateSettings({ aurora_alerts: val }),
                            Sparkles,
                            '#A78BFA',
                            'Upozornění na polární záři'
                        )}
                    </View>

                    {/* AI Settings */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        AI PŘEDPOVĚĎ
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        {renderOptionRow(
                            'Styl předpovědi',
                            [
                                { label: '🛡️ Opatrný', value: 'cautious' },
                                { label: '⚖️ Vyvážený', value: 'balanced' },
                                { label: '🌟 Optimistický', value: 'optimistic' },
                            ],
                            settings.confidence_bias,
                            (val) => updateSettings({ confidence_bias: val }),
                            'confidence',
                            Sparkles,
                            '#10B981',
                            'Jak moc optimistická bude AI'
                        )}
                    </View>

                    {/* About */}
                    <Text style={[styles.sectionHeader, { color: subTextColor }]}>
                        O APLIKACI
                    </Text>
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.settingRow}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(74,144,217,0.2)' }]}>
                                <Info size={20} color="#4A90D9" strokeWidth={2} />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingLabel, { color: textColor }]}>Weatherly AI</Text>
                                <Text style={[styles.settingDescription, { color: subTextColor }]}>
                                    AI agregace počasí ze 4 zdrojů
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
                                    Zobrazit zdrojový kód
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
});

export default SettingsScreen;
