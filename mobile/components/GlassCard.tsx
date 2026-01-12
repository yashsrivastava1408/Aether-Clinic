import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'dark' | 'light' | 'primary';
}

export const GlassCard = React.memo(function GlassCard({ children, style, variant = 'dark' }: GlassCardProps) {
    let colors: readonly [string, string, ...string[]] = ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'];
    let borderColor = 'rgba(255,255,255,0.1)';

    if (variant === 'primary') {
        colors = ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'];
        borderColor = 'rgba(16, 185, 129, 0.3)';
    }

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { borderColor }]}
            >
                {children}
            </LinearGradient>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        // Removed potential shadow here as well if it existed, but it was clean.
    },
    gradient: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        width: '100%',
        height: '100%',
    },
});

