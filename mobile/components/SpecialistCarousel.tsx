import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { IconSymbol } from './ui/icon-symbol';
import { GlassCard } from './GlassCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const specialists = [
    { id: 1, name: "Heart Specialist", role: "Cardiologist", description: "Heart & blood circulation.", accuracy: "99.9%", icon: "heart.text.square", color: "#f43f5e" },
    { id: 2, name: "Brain Specialist", role: "Neurologist", description: "Brain & nervous system.", accuracy: "99.7%", icon: "brain.head.profile", color: "#8b5cf6" },
    { id: 3, name: "Lung Specialist", role: "Pulmonologist", description: "Lungs & breathing health.", accuracy: "99.5%", icon: "lungs.fill", color: "#06b6d4" },
    { id: 4, name: "Stomach Specialist", role: "Gastroenterologist", description: "Digestive system & gut.", accuracy: "99.8%", icon: "pills.fill", color: "#10b981" },
    { id: 5, name: "Bone Specialist", role: "Orthopedist", description: "Bones, joints & spine.", accuracy: "99.6%", icon: "figure.walk", color: "#f59e0b" },
];

export function SpecialistCarousel({ onSelect }: { onSelect: (spec: any) => void }) {
    const rotation = useSharedValue(0);
    const context = useSharedValue(0);

    const pan = Gesture.Pan()
        .onBegin(() => {
            context.value = rotation.value;
        })
        .onUpdate((e) => {
            rotation.value = context.value + e.translationX / 2;
        })
        .onEnd((e) => {
            const snapAngle = 360 / specialists.length;
            const velocity = e.velocityX / 10;
            const predictedEnd = rotation.value + velocity;
            const closestSnap = Math.round(predictedEnd / snapAngle) * snapAngle;
            rotation.value = withSpring(closestSnap, { damping: 20, stiffness: 90 });
        });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Specialist</Text>
                <Text style={styles.subtitle}>Rotate to explore • Tap to consult</Text>
            </View>

            <View style={styles.backgroundTextContainer} pointerEvents="none">
                <Text style={styles.backgroundText}>AETHER</Text>
                <Text style={styles.backgroundText}>CLINIC</Text>
            </View>

            <GestureDetector gesture={pan}>
                <View style={styles.carouselContainer}>
                    {specialists.map((spec, index) => {
                        return (
                            <CarouselItem
                                key={spec.id}
                                spec={spec}
                                index={index}
                                count={specialists.length}
                                rotation={rotation}
                                onSelect={onSelect}
                            />
                        );
                    })}
                </View>
            </GestureDetector>
        </View>
    );
}

// Extract static styles to avoid recreation
const CarouselItem = React.memo(({ spec, index, count, rotation, onSelect }: any) => {
    const anglePerItem = 360 / count;
    const initialAngle = index * anglePerItem;

    const animatedStyle = useAnimatedStyle(() => {
        const currentRotation = rotation.value % 360;
        const finalAngle = (initialAngle + currentRotation) * (Math.PI / 180);

        const radius = width * 0.55;
        const x = Math.sin(finalAngle) * radius;
        const z = Math.cos(finalAngle) * radius;

        const scale = interpolate(z, [-radius, radius], [0.6, 1.1], Extrapolation.CLAMP);
        const opacity = interpolate(z, [-radius, radius], [0.4, 1], Extrapolation.CLAMP);

        // Optimize: Use simpler zIndex calculation
        const zIndex = Math.round(z + radius);

        return {
            transform: [
                { translateX: x },
                { scale },
                // removed perspective from here, handled in container if needed, or simplified
            ],
            opacity,
            zIndex,
        };
    });

    return (
        <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => runOnJS(onSelect)(spec)}>
                <GlassCard style={[styles.card, { borderColor: spec.color + '40' }]}>
                    <View style={[styles.iconBox, { backgroundColor: spec.color + '20', borderColor: spec.color }]}>
                        <IconSymbol name={spec.icon} size={32} color={spec.color} />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>{spec.name}</Text>
                        <Text style={[styles.cardRole, { color: spec.color }]}>{spec.role}</Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>{spec.description}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View>
                            <Text style={styles.statLabel}>ACCURACY</Text>
                            <Text style={styles.statValue}>{spec.accuracy}</Text>
                        </View>
                        <View style={[styles.accuracyBar, { backgroundColor: spec.color }]} />
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    carouselContainer: {
        width: width,
        height: 400,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: 320,
    },
    card: {
        height: '100%',
        justifyContent: 'space-between',
        borderWidth: 1,
        // Removed generic border to reduce draw calls if handled above
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 24, // Increased spacing
    },
    cardTitle: {
        color: '#fff',
        fontSize: 26, // Slightly larger
        fontWeight: 'bold',
        marginBottom: 8, // Increased spacing
        letterSpacing: 0.5,
    },
    cardRole: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5, // Increased letter spacing
        marginBottom: 16, // Increased spacing
        opacity: 0.9,
    },
    cardDesc: {
        color: '#94a3b8',
        fontSize: 15,
        lineHeight: 22, // Increased line height
        marginBottom: 24, // Increased spacing
        opacity: 0.8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 20, // Increased padding
    },
    statLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'monospace',
        fontWeight: '600',
    },
    accuracyBar: {
        width: 60,
        height: 4,
        borderRadius: 2,
        opacity: 0.8,
    },
    backgroundTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
        // Push it slightly lower to be behind the cards visually
        marginTop: 50,
    },
    backgroundText: {
        color: '#22d3ee', // Cyan-400
        fontSize: 80,
        fontWeight: '900',
        textTransform: 'uppercase',
        opacity: 0.1,
        letterSpacing: 10,
        includeFontPadding: false,
        textAlign: 'center',
    },
});
