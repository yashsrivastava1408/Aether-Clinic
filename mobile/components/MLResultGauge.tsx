import React, { useEffect } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    interpolateColor,
    useAnimatedStyle
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MLResultGaugeProps {
    percentage?: number;
    level?: string;
}

export default function MLResultGauge({ percentage = 0, level = "Low" }: MLResultGaugeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(percentage / 100, { duration: 1500 });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = 283 * (1 - progress.value);
        return {
            strokeDashoffset,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [0, 0.3, 0.6, 1],
            ['#10b981', '#10b981', '#f59e0b', '#ef4444']
        );
        return { color };
    });

    const getLevelColor = () => {
        if (level === "High") return "#ef4444";
        if (level === "Medium") return "#f59e0b";
        return "#10b981";
    };

    const levelColor = getLevelColor();

    return (
        <View style={styles.container}>
            {/* Glow Effect */}
            <View style={[styles.glow, { backgroundColor: levelColor, opacity: isDark ? 0.15 : 0.05 }]} />

            <Svg height="160" width="160" viewBox="0 0 100 100">
                {/* Background Circle */}
                <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    strokeWidth="6"
                    fill="none"
                />
                {/* Progress Circle */}
                <AnimatedCircle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={levelColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="283"
                    animatedProps={animatedProps}
                    rotation="-90"
                    origin="50, 50"
                />
            </Svg>

            <View style={styles.textContainer}>
                <Animated.Text style={[styles.percentageText, animatedTextStyle]}>
                    {percentage}%
                </Animated.Text>
                <Text style={[styles.levelText, { color: levelColor }]}>
                    {level} RISK
                </Text>
            </View>

            <View style={[styles.badge, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={styles.badgeText}>NEURAL ANALYSIS ACTIVE</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 32,
        fontWeight: '800',
        fontFamily: 'System', // Adjust if you have loaded custom font
    },
    levelText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        bottom: -10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    badgeText: {
        color: '#10b981',
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
