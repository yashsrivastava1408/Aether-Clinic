import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    runOnJS,
    interpolateColor,
} from 'react-native-reanimated';

// 🚨 VERY IMPORTANT
SplashScreen.preventAutoHideAsync();

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
    // ─────────────────────────────────────
    // SHARED VALUES
    // ─────────────────────────────────────
    const scale = useSharedValue(0.6);
    const pulse = useSharedValue(0);
    const ring = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    // ─────────────────────────────────────
    // SAFETY CONTROLS
    // ─────────────────────────────────────
    const hasExited = useRef(false);
    const [layoutReady, setLayoutReady] = useState(false);

    const safeFinish = () => {
        if (!hasExited.current) {
            hasExited.current = true;
            onFinish();
        }
    };

    // ─────────────────────────────────────
    // START ANIMATIONS (ONLY ONCE)
    // ─────────────────────────────────────
    const startAnimations = () => {
        // 🌬 BREATHING CORE
        pulse.value = withRepeat(
            withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        // 💍 ENERGY RING
        ring.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        // 🚀 PORTAL EXPANSION → EXIT
        scale.value = withSequence(
            withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }),
            withDelay(
                1000,
                withTiming(26, { duration: 900, easing: Easing.in(Easing.cubic) }, () => {
                    containerOpacity.value = withTiming(0, { duration: 400 }, () => {
                        runOnJS(safeFinish)();
                    });
                })
            )
        );

        // 🧠 TEXT REVEAL
        textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    };

    // ─────────────────────────────────────
    // LAYOUT GATE (THE FIX)
    // ─────────────────────────────────────
    const onLayout = async () => {
        if (!layoutReady) {
            setLayoutReady(true);

            // ✅ Hide native splash ONLY after JS layout exists
            await SplashScreen.hideAsync();

            startAnimations();
        }
    };

    // 🛟 SAFETY FALLBACK (never stuck)
    useEffect(() => {
        const timeout = setTimeout(() => {
            safeFinish();
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    // ─────────────────────────────────────
    // ANIMATED STYLES
    // ─────────────────────────────────────
    const coreStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            pulse.value,
            [0, 1],
            ['#10b981', '#22d3ee']
        );

        return {
            transform: [{ scale: scale.value }],
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 1,
            shadowRadius: 60,
        };
    });

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + ring.value * 3 }],
        opacity: 1 - ring.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ scale: textOpacity.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    // ─────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────
    return (
        <Animated.View
            style={[styles.container, containerStyle]}
            onLayout={onLayout}
        >
            {/* Energy Ring */}
            <Animated.View style={[styles.ring, ringStyle]} />

            {/* Core */}
            <Animated.View style={[styles.core, coreStyle]} />

            {/* Brand */}
            <Animated.View style={[styles.textContainer, textStyle]}>
                <Text style={styles.title}>AETHER </Text>
                <Text style={styles.subtitle}>INTELLIGENT HEALTHCARE</Text>
            </Animated.View>
        </Animated.View>
    );
}

// ─────────────────────────────────────
// STYLES
// ─────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },

    core: {
        width: 110,
        height: 110,
        borderRadius: 55,
        elevation: 30, // Android glow
    },

    ring: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(16,185,129,0.7)',
    },

    textContainer: {
        position: 'absolute',
        alignItems: 'center',
    },

    title: {
        fontSize: 52,
        fontWeight: '900',
        letterSpacing: 6,
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
        textShadowColor: 'rgba(16,185,129,0.9)',
        textShadowRadius: 25,
    },

    subtitle: {
        marginTop: 8,
        fontSize: 12,
        letterSpacing: 8,
        color: 'rgba(255,255,255,0.75)',
    },
});