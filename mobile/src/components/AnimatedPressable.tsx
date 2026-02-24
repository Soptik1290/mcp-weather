import React, { useRef, useCallback } from 'react';
import {
    Animated,
    TouchableWithoutFeedback,
    ViewStyle,
    StyleProp,
    GestureResponderEvent,
} from 'react-native';

interface AnimatedPressableProps {
    children: React.ReactNode;
    onPress?: (event: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    scaleTo?: number;
}

/**
 * A premium-feeling pressable wrapper that provides a subtle scale-down
 * animation on press, similar to iOS system buttons.
 */
export function AnimatedPressable({
    children,
    onPress,
    style,
    disabled = false,
    scaleTo = 0.96,
}: AnimatedPressableProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: scaleTo,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [scaleTo]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <TouchableWithoutFeedback
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

export default AnimatedPressable;
