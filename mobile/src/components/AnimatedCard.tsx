import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface AnimatedCardProps {
    children: React.ReactNode;
    index?: number;
    style?: StyleProp<ViewStyle>;
    delay?: number;
}

/**
 * Wraps a child view in a smooth fade-in + slide-up entrance animation.
 * Use `index` to create a staggered cascade effect across multiple cards.
 */
export function AnimatedCard({ children, index = 0, style, delay }: AnimatedCardProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(18)).current;

    useEffect(() => {
        const staggerDelay = delay ?? index * 80;
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 420,
                delay: staggerDelay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 420,
                delay: staggerDelay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
}

export default AnimatedCard;
