import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, X, AlertTriangle, Info } from 'lucide-react-native';
import { BlurView } from '@react-native-community/blur';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
    buttons?: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
}

const { width } = Dimensions.get('window');

export const CustomAlert = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    buttons = []
}: CustomAlertProps) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                scaleAnim.setValue(0.8);
            });
        }
    }, [visible]);

    if (!visible) return null;

    // Configuration based on type
    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <Check size={32} color="#fff" />,
                    gradient: ['#10B981', '#059669'], // Green
                    shadowColor: '#10B981'
                };
            case 'error':
                return {
                    icon: <X size={32} color="#fff" />,
                    gradient: ['#EF4444', '#DC2626'], // Red
                    shadowColor: '#EF4444'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={32} color="#fff" />,
                    gradient: ['#F59E0B', '#D97706'], // Amber
                    shadowColor: '#F59E0B'
                };
            case 'info':
            default:
                return {
                    icon: <Info size={32} color="#fff" />,
                    gradient: ['#3B82F6', '#2563EB'], // Blue
                    shadowColor: '#3B82F6'
                };
        }
    };

    const config = getConfig();
    const hasButtons = buttons.length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                            shadowColor: config.shadowColor
                        }
                    ]}
                >
                    <BlurView
                        style={StyleSheet.absoluteFill}
                        blurType="dark"
                        blurAmount={10}
                        reducedTransparencyFallbackColor="#1e293b"
                    />

                    {/* Header Icon */}
                    <LinearGradient
                        colors={config.gradient}
                        style={styles.iconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {config.icon}
                    </LinearGradient>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {hasButtons ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        btn.style === 'cancel' && styles.cancelButton,
                                        btn.style === 'destructive' && styles.destructiveButton
                                    ]}
                                    onPress={() => {
                                        btn.onPress();
                                        // Auto-close is handled by parent usually, but we could add onClose() here if needed
                                    }}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        btn.style === 'cancel' && styles.cancelText,
                                        btn.style === 'destructive' && styles.destructiveText
                                    ]}>{btn.text}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={onClose}
                            >
                                <LinearGradient
                                    colors={config.gradient}
                                    style={styles.primaryButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.buttonText}>OK</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    alertContainer: {
        width: width * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 41, 59, 0.8)', // Fallback for no blur
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    message: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        marginTop: 10,
    },
    button: {
        flex: 1,
        height: 48, // Explicit height to prevent expansion
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    destructiveButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    destructiveText: {
        color: '#EF4444',
    }
});
