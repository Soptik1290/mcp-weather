import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: object;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                style
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    { transform: [{ translateX }] }
                ]}
            >
                <LinearGradient
                    colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.3)',
                        'rgba(255,255,255,0)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

// Pre-built skeleton layouts for common use cases
export function WeatherSkeleton({ cardBg }: { cardBg: string }) {
    return (
        <View style={styles.weatherContainer}>
            {/* Location */}
            <View style={styles.headerSkeleton}>
                <Skeleton width={180} height={36} borderRadius={12} />
                <Skeleton width={100} height={20} borderRadius={8} style={{ marginTop: 8 }} />
            </View>

            {/* Current weather */}
            <View style={styles.currentSkeleton}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <Skeleton width={120} height={72} borderRadius={16} style={{ marginTop: 12 }} />
                <Skeleton width={140} height={20} borderRadius={8} style={{ marginTop: 12 }} />
            </View>

            {/* Hourly forecast */}
            <View style={[styles.cardSkeleton, { backgroundColor: cardBg }]}>
                <Skeleton width={140} height={20} borderRadius={8} />
                <View style={styles.hourlyRow}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i} style={styles.hourItem}>
                            <Skeleton width={30} height={14} borderRadius={4} />
                            <Skeleton width={28} height={28} borderRadius={14} style={{ marginVertical: 8 }} />
                            <Skeleton width={24} height={16} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Chart */}
            <View style={[styles.cardSkeleton, { backgroundColor: cardBg }]}>
                <Skeleton width={100} height={20} borderRadius={8} />
                <Skeleton width="100%" height={120} borderRadius={12} style={{ marginTop: 16 }} />
            </View>

            {/* Details grid */}
            <View style={[styles.cardSkeleton, { backgroundColor: cardBg }]}>
                <Skeleton width={120} height={20} borderRadius={8} />
                <View style={styles.detailsGrid}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={styles.detailItem}>
                            <Skeleton width={24} height={24} borderRadius={12} />
                            <Skeleton width={40} height={18} borderRadius={4} style={{ marginTop: 8 }} />
                            <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    shimmer: {
        width: 200,
        height: '100%',
        position: 'absolute',
    },
    weatherContainer: {
        padding: 20,
        paddingTop: 60,
    },
    headerSkeleton: {
        marginBottom: 30,
    },
    currentSkeleton: {
        alignItems: 'center',
        marginBottom: 30,
    },
    cardSkeleton: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    hourlyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    hourItem: {
        alignItems: 'center',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        gap: 8,
    },
    detailItem: {
        width: '31%',
        alignItems: 'center',
        paddingVertical: 12,
    },
});

export default Skeleton;
