import React, { useState, useCallback } from 'react';
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
import { Search, MapPin, ArrowLeft, Navigation } from 'lucide-react-native';

import { weatherService } from '../services';
import { useLocationStore } from '../stores';
import { useGeolocation } from '../hooks/useGeolocation';

interface SearchResult {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

interface SearchScreenProps {
    onClose: () => void;
}

export function SearchScreen({ onClose }: SearchScreenProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setCurrentLocation } = useLocationStore();
    const { getCurrentPosition, loading: geoLoading } = useGeolocation();

    // Debounced search
    const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
                setError('Nepodařilo se vyhledat lokace');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

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
            // Get location name from coordinates via API
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
                setError('Nepodařilo se získat počasí pro vaši polohu');
            }
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f0f0f']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <ArrowLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Vyhledat lokaci</Text>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Search size={20} color="rgba(255,255,255,0.5)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Zadejte město..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={query}
                            onChangeText={handleSearch}
                            autoFocus
                        />
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity
                        style={styles.currentLocationButton}
                        onPress={handleUseCurrentLocation}
                        disabled={geoLoading}
                    >
                        {geoLoading ? (
                            <ActivityIndicator size="small" color="#4A90D9" />
                        ) : (
                            <Navigation size={20} color="#4A90D9" />
                        )}
                        <Text style={styles.currentLocationText}>
                            {geoLoading ? 'Získávám polohu...' : 'Použít mou polohu'}
                        </Text>
                    </TouchableOpacity>

                    {/* Error */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    {/* Loading */}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    )}

                    {/* Results */}
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => `${item.name}-${item.latitude}-${index}`}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelectLocation(item)}
                            >
                                <MapPin size={20} color="rgba(255,255,255,0.6)" />
                                <View style={styles.resultTextContainer}>
                                    <Text style={styles.resultName}>{item.name}</Text>
                                    <Text style={styles.resultCountry}>
                                        {[item.admin1, item.country].filter(Boolean).join(', ')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            query.length >= 2 && !loading ? (
                                <Text style={styles.emptyText}>
                                    Žádné výsledky pro "{query}"
                                </Text>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#fff',
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.2)',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    currentLocationText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#4A90D9',
        fontWeight: '500',
    },
    errorText: {
        color: '#ff6b6b',
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    resultTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    resultCountry: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        paddingVertical: 32,
    },
});

export default SearchScreen;
