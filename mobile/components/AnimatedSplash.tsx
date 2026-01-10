import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withRepeat,
    withDelay,
    withSpring,
    Easing,
    runOnJS,
    interpolateColor,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
SplashScreen.preventAutoHideAsync();

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
    const scale = useSharedValue(1); // ✅ START VISIBLE
    const glow = useSharedValue(0);
    const ring = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        SplashScreen.hideAsync();

        // Small delay so first frame renders
        setTimeout(() => {
            // 🌬 Breath pulse
            glow.value = withRepeat(
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );

            ring.value = withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );

            // 🚀 Portal expansion
            scale.value = withSequence(
                withTiming(1.2, { duration: 600 }),
                withTiming(28, { duration: 900, easing: Easing.in(Easing.cubic) })
            );

            textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

            setTimeout(() => {
                containerOpacity.value = withTiming(0, { duration: 600 }, () => {
                    runOnJS(onFinish)();
                });
            }, 2800);
        }, 100); // 👈 CRITICAL
    }, []);

    const coreStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            glow.value,
            [0, 1],
            ['#10b981', '#22d3ee']
        );

        return {
            transform: [{ scale: scale.value }],
            backgroundColor: bg,
            shadowColor: bg,
            shadowOpacity: 0.9,
            shadowRadius: 60,
        };
    });

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ring.value * scale.value }],
        opacity: 1 - ring.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.core, coreStyle]} />
            <Animated.View style={[styles.textContainer, textStyle]}>
                <Text style={styles.title}>AETHER</Text>
                <Text style={styles.subtitle}>SENTIENT OS</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },

    core: {
        width: 100,
        height: 100,
        borderRadius: 50,
        elevation: 30,
    },

    ring: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(16,185,129,0.6)',
    },

    textContainer: {
        position: 'absolute',
        alignItems: 'center',
    },

    title: {
        fontSize: 52,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 6,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
        textShadowColor: 'rgba(16,185,129,0.8)',
        textShadowRadius: 20,
    },

    subtitle: {
        fontSize: 12,
        marginTop: 8,
        letterSpacing: 8,
        color: 'rgba(255,255,255,0.8)',
    },
});