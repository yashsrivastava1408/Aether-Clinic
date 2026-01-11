import React from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlitchText } from '@/components/ui/GlitchText';

const THEME = {
    bg: '#050505',
    primary: '#10b981',
    text: '#ffffff',
    textDim: '#a1a1aa',
};

export default function ClinicsScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[THEME.bg, '#000']}
                style={StyleSheet.absoluteFill}
            />

            {/* BACKGROUND MESH */}
            <View style={styles.bgGrid} pointerEvents="none" />

            <SafeAreaView style={styles.content}>
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="construct-outline" size={48} color={THEME.primary} />
                    </LinearGradient>
                </View>

                <GlitchText text="MODULE_LOCKED" style={styles.title} color={THEME.primary} />

                <Text style={styles.description}>
                    The Global Clinic Network is currently initializing.
                    Neural nodes are being established.
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>COMING SOON</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
    },
    bgGrid: {
        position: 'absolute', width: '100%', height: '100%', opacity: 0.1, zIndex: -1,
        // Simple grid effect logic could be added here if needed, or reused from other screens
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        color: THEME.textDim,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
        marginBottom: 40,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 1,
        fontSize: 12,
    },
});
