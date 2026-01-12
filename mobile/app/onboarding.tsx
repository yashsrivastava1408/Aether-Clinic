import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlitchText } from '@/components/ui/GlitchText';
import { useAuth } from '@/context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const { user } = useAuth();

    // Unique "Breathing & Floating" Animation
    const floatY = useSharedValue(0);
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.5);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Floating Y-Axis
        floatY.value = withRepeat(
            withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
        // Subtle Breathing Scale
        scale.value = withRepeat(
            withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
        // Glowing Pulse
        glowOpacity.value = withRepeat(
            withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
        // Continuous Rotation
        rotate.value = withRepeat(
            withTiming(360, { duration: 10000, easing: Easing.linear }),
            -1,
            false // Do not reverse, just loop
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: floatY.value },
            { scale: scale.value }
        ],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const handleGuest = async () => {
        // Mark onboarding as done so we don't show this again (optional logic for root layout)
        await SecureStore.setItemAsync('has_onboarded', 'true');
        router.replace('/(tabs)');
    };

    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <View style={styles.container}>
            {/* 🌌 Background */}
            <LinearGradient
                colors={['#000000', '#0a0a0a', '#051f15']}
                style={StyleSheet.absoluteFill}
            />

            {/* Grid Overlay */}
            <View style={styles.gridOverlay} pointerEvents="none" />

            {/* Content */}
            <SafeAreaView style={styles.content}>
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="medical" size={48} color="#10b981" />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <GlitchText
                        text="AETHER CLINIC"
                        style={styles.title}
                        color="#10b981"
                    />
                    <Text style={styles.subtitle}>
                        Advanced Neural Health Interface
                    </Text>
                </Animated.View>

                <View style={[styles.spacer, { justifyContent: 'center', alignItems: 'center' }]}>
                    {/* Outer Ring - Rotating */}
                    <Animated.View style={[
                        { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: '#10b981', borderStyle: 'dashed', opacity: 0.2 },
                        { transform: [{ rotate: '45deg' }] }, // Static offset
                        useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }))
                    ]} />

                    {/* Inner Ring - Counter Rotating */}
                    <Animated.View style={[
                        { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: '#10b981', opacity: 0.3, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
                        useAnimatedStyle(() => ({ transform: [{ rotate: `-${rotate.value * 1.5}deg` }] }))
                    ]} />

                    {/* Core Glow */}
                    <Animated.View style={[
                        { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981', opacity: 0.2 },
                        glowStyle
                    ]} />

                    {/* Central 3D Medical Cross */}
                    <Animated.View style={[animatedStyle, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Image 
                            source={require('../assets/images/neon_cross.png')} 
                            style={{ width: 140, height: 140, resizeMode: 'contain' }} 
                        />
                    </Animated.View>
                </View>

                {/* Actions */}
                <Animated.View entering={FadeInDown.delay(600).springify()} style={{ width: '100%', gap: 16 }}>

                    {/* Guest Button */}
                    <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Ionicons name="flash-outline" size={24} color="#10b981" />
                            <View>
                                <Text style={styles.guestTitle}>Continue as Guest</Text>
                                <Text style={styles.guestSub}>No login required. Start instantly.</Text>
                            </View>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#10b981" style={{ opacity: 0.5 }} />
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginText}>LOG IN / SIGN UP</Text>
                    </TouchableOpacity>

                </Animated.View>

                <Animated.View entering={FadeInDown.delay(800)}>
                    <Text style={styles.footerText}>Verify Identity • v1.0.0</Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    gridOverlay: {
        position: 'absolute', width: '100%', height: '100%',
        backgroundColor: 'transparent',
        opacity: 0.1,
        // In a real app, uses an image pattern or svg
        borderWidth: 1, borderColor: '#333'
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16,185,129,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
        shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20,
    },
    title: {
        fontSize: 32, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginBottom: 8,
    },
    subtitle: {
        fontSize: 14, color: '#666', letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase',
    },
    spacer: { flex: 1 },

    guestButton: {
        width: '100%',
        height: 80,
        borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20,
        overflow: 'hidden',
        justifyContent: 'space-between',
    },
    guestTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    guestSub: { color: '#888', fontSize: 11, marginTop: 2 },

    loginButton: {
        padding: 16, alignItems: 'center', justifyContent: 'center',
    },
    loginText: { color: '#444', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    footer: { marginTop: 40, opacity: 0.5 },
    footerText: { color: '#333', fontSize: 10, letterSpacing: 1 },
});
