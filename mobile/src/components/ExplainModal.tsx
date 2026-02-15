import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { X, Sparkles, BrainCircuit } from 'lucide-react-native';
import { BlurView } from '@react-native-community/blur';

interface SourceData {
    name: string;
    temp: number;
    desc: string;
    wind?: number;
}

interface ExplainModalProps {
    visible: boolean;
    onClose: () => void;
    loading: boolean;
    explanation: string;
    sources: SourceData[];
    themeGradient: string[];
    isDark: boolean;
    language: string;
}

export const ExplainModal = ({
    visible,
    onClose,
    loading,
    explanation,
    sources,
    themeGradient,
    isDark,
    language
}: ExplainModalProps) => {
    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)';
    const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={[styles.modalContainer, { shadowColor: isDark ? '#000' : '#888' }]}>
                    <LinearGradient
                        colors={themeGradient}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.titleContainer}>
                                <Sparkles size={24} color="#FFD700" style={{ marginRight: 8 }} />
                                <Text style={[styles.title, { color: textColor }]}>
                                    {language === 'cs' ? 'AI Meteorolog' : 'AI Meteorologist'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.content}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <BrainCircuit size={48} color={textColor} style={{ opacity: 0.8, marginBottom: 16 }} />
                                    <ActivityIndicator size="large" color={textColor} />
                                    <Text style={[styles.loadingText, { color: textColor }]}>
                                        {language === 'cs' ? 'Analyzuji data...' : 'Analyzing data sources...'}
                                    </Text>
                                    <Text style={[styles.loadingSubtext, { color: subTextColor }]}>
                                        {language === 'cs' ? 'Porovnávám 6 modelů počasí' : 'Comparing 6 weather models'}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Explanation Card */}
                                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                                        {explanation.split('\n').map((line, index) => {
                                            // Headers (ANALYSIS, FORECAST, REASONING) or typical Czech equivalents
                                            const isHeader = /^(ANALÝZA|PŘEDPOVĚĎ|PROGNÓZA|DŮVOD|ANALYSIS|FORECAST|REASONING)/i.test(line.trim());

                                            // Highlighted terms
                                            const parts = line.split(/(\d+°C|\d+ km\/h|OpenMeteo|OpenWeatherMap|WeatherAPI|MetNorway|BrightSky|VisualCrossing)/g);

                                            if (isHeader) {
                                                return (
                                                    <Text key={index} style={[styles.explanationHeader, { color: textColor }]}>
                                                        {line.trim()}
                                                    </Text>
                                                );
                                            }

                                            return (
                                                <Text key={index} style={[styles.explanationText, { color: textColor }]}>
                                                    {parts.map((part, i) => {
                                                        const isHighlight = /\d+°C|\d+ km\/h/.test(part) ||
                                                            ['OpenMeteo', 'OpenWeatherMap', 'WeatherAPI', 'MetNorway', 'BrightSky', 'VisualCrossing'].includes(part);
                                                        return (
                                                            <Text key={i} style={isHighlight ? { fontWeight: 'bold', color: '#FFD700' } : {}}>
                                                                {part}
                                                            </Text>
                                                        );
                                                    })}
                                                </Text>
                                            );
                                        })}
                                    </View>

                                    {/* Sources Section */}
                                    {sources && sources.length > 0 && (
                                        <View style={styles.sourcesSection}>
                                            <Text style={[styles.sectionTitle, { color: subTextColor }]}>
                                                {language === 'cs' ? 'Analyzované zdroje' : 'Analyzed Sources'}
                                            </Text>

                                            {sources.map((source, index) => (
                                                <View key={index} style={[styles.sourceRow, { borderBottomColor: borderColor }]}>
                                                    <Text style={[styles.sourceName, { color: textColor }]}>
                                                        {source.name.replace('_', ' ')}
                                                    </Text>
                                                    <View style={styles.sourceData}>
                                                        <Text style={[styles.sourceTemp, { color: textColor }]}>
                                                            {Math.round(source.temp)}°
                                                        </Text>
                                                        <Text style={[styles.sourceDesc, { color: subTextColor }]}>
                                                            {source.desc}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
    },
    loadingSubtext: {
        marginTop: 4,
        fontSize: 14,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    explanationText: {
        fontSize: 16,
        lineHeight: 24,
    },
    sourcesSection: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    explanationHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    sourceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sourceName: {
        fontWeight: '600',
        fontSize: 14,
    },
    sourceData: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sourceTemp: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    sourceDesc: {
        fontSize: 14,
        textTransform: 'capitalize',
        width: 100,
        textAlign: 'right',
    },
});
