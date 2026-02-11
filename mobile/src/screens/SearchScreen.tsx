import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Search, MapPin, X, Navigation, ChevronRight } from 'lucide-react-native';

import { weatherService } from '../services';
import { useLocationStore } from '../stores';
import { useGeolocation } from '../hooks/useGeolocation';
import { t } from '../utils';

interface SearchResult {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

interface SearchScreenProps {
    onClose: () => void;
    themeGradient?: string[];
    isDark?: boolean;
    language?: 'en' | 'cs';
}

export function SearchScreen({
    onClose,
    themeGradient = ['#4A90D9', '#67B8DE', '#8BC7E8'],
    isDark = false,
    language = 'cs'
}: SearchScreenProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setCurrentLocation } = useLocationStore();
    const { getCurrentPosition, loading: geoLoading } = useGeolocation();

    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const cardBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
    const inputBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

    // Debounced search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length < 2) {
            setResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setLoading(true);
            setError(null);

            try {
                const searchResults = await weatherService.searchLocation(text);
                setResults(searchResults);
            } catch (err) {
                console.error('Search error:', err);
                setError(t('search_error', language));
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, [language]);

    const handleSelectLocation = (location: SearchResult) => {
        setCurrentLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            country: location.country,
        });
        onClose();
    };

    const handleUseCurrentLocation = async () => {
        const position = await getCurrentPosition();
        if (position) {
            try {
                const weatherData = await weatherService.getWeatherByCoordinates(
                    position.latitude,
                    position.longitude,
                    1
                );
                setCurrentLocation({
                    name: weatherData.location.name,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    country: weatherData.location.country,
                });
                onClose();
            } catch (err) {
                console.error('Geolocation weather error:', err);
                setError(t('error_load', language));
            }
        }
    };

    const renderResultItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={[styles.resultCard, { backgroundColor: cardBg }]}
            onPress={() => handleSelectLocation(item)}
            activeOpacity={0.7}
        >
            <View style={styles.resultIconContainer}>
                <MapPin size={22} color={textColor} strokeWidth={1.5} />
            </View>
            <View style={styles.resultContent}>
                <Text style={[styles.resultName, { color: textColor }]}>
                    {item.name}
                </Text>
                <Text style={[styles.resultSubtitle, { color: subTextColor }]}>
                    {[item.admin1, item.country].filter(Boolean).join(', ')}
                </Text>
            </View>
            <ChevronRight size={20} color={subTextColor} />
        </TouchableOpacity>
    );

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <LinearGradient
                colors={themeGradient}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>
                            {t('search_title', language)}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: cardBg }]}
                        >
                            <X size={22} color={textColor} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={[styles.searchContainer, { backgroundColor: inputBg }]}>
                        <Search size={20} color={subTextColor} />
                        <TextInput
                            style={[styles.searchInput, { color: textColor }]}
                            placeholder={t('search_city', language)}
                            placeholderTextColor={subTextColor}
                            value={query}
                            onChangeText={handleSearch}
                            autoFocus
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <X size={18} color={subTextColor} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity
                        style={[styles.geoButton, { backgroundColor: cardBg }]}
                        onPress={handleUseCurrentLocation}
                        disabled={geoLoading}
                        activeOpacity={0.7}
                    >
                        <View style={styles.geoIconContainer}>
                            {geoLoading ? (
                                <ActivityIndicator size="small" color={textColor} />
                            ) : (
                                <Navigation size={20} color={textColor} />
                            )}
                        </View>
                        <View style={styles.geoContent}>
                            <Text style={[styles.geoTitle, { color: textColor }]}>
                                {geoLoading ? t('detecting_location', language) : t('use_my_location', language)}
                            </Text>
                            <Text style={[styles.geoSubtitle, { color: subTextColor }]}>
                                {t('auto_detect', language)}
                            </Text>
                        </View>
                        <ChevronRight size={20} color={subTextColor} />
                    </TouchableOpacity>

                    {/* Divider */}
                    {results.length > 0 && (
                        <View style={styles.divider}>
                            <Text style={[styles.dividerText, { color: subTextColor }]}>
                                {t('search_results', language)}
                            </Text>
                        </View>
                    )}

                    {/* Error */}
                    {error && (
                        <View style={[styles.errorContainer, { backgroundColor: 'rgba(255,100,100,0.15)' }]}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Loading */}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={textColor} />
                            <Text style={[styles.loadingText, { color: subTextColor }]}>
                                {t('searching', language)}
                            </Text>
                        </View>
                    )}

                    {/* Results */}
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                        renderItem={renderResultItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            query.length >= 2 && !loading ? (
                                <View style={styles.emptyContainer}>
                                    <MapPin size={48} color={subTextColor} strokeWidth={1} />
                                    <Text style={[styles.emptyText, { color: subTextColor }]}>
                                        {t('no_results', language)} "{query}"
                                    </Text>
                                    <Text style={[styles.emptyHint, { color: subTextColor }]}>
                                        {t('try_another_city', language)}
                                    </Text>
                                </View>
                            ) : null
                        }
                    />
                </SafeAreaView>
            </LinearGradient>
        </>
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
    title: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    closeButton: {
        padding: 10,
        borderRadius: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
    },
    geoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        gap: 12,
    },
    geoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74,144,217,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    geoContent: {
        flex: 1,
    },
    geoTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    geoSubtitle: {
        fontSize: 13,
        marginTop: 2,
        marginBottom: 2,
    },
    divider: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
    },
    dividerText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    errorContainer: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
    },
    errorText: {
        color: '#ff6b6b',
        textAlign: 'center',
        fontSize: 14,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        gap: 12,
    },
    resultIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: 17,
        fontWeight: '600',
    },
    resultSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyHint: {
        fontSize: 14,
    },
});

export default SearchScreen;
