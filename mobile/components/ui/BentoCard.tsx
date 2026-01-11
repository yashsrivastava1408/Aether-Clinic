import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface BentoCardProps {
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof IconSymbol>['name'];
    color: string;
    onPress: () => void;
    size?: 'small' | 'large';
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const BentoCard = ({ title, subtitle, icon, color, onPress, size = 'small', delay = 0, style }: BentoCardProps) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    // 🚀 Crazy Entrance Animation
    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 4,     // Bouncier
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    const rotateStr = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['10deg', '0deg']
    });

    return (
        <Animated.View style={[
            styles.bentoCardWrapper,
            style,
            {
                opacity,
                transform: [
                    { scale },
                    { translateY },
                    { rotate: rotateStr }
                ]
            }
        ]}>
            <TouchableOpacity
                style={[styles.bentoCard, { borderColor: color + '40' }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={[color + '20', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
                        <IconSymbol name={icon} size={28} color={color} />
                    </View>
                    <IconSymbol name="arrow.up.right" size={16} color={color + '80'} />
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bentoCardWrapper: {
        marginBottom: 16,
    },
    bentoCard: {
        height: 160,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardContent: {},
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 16,
    },
});
