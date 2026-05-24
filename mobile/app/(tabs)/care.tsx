import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlitchText } from '@/components/ui/GlitchText';
import { BentoCard } from '@/components/ui/BentoCard';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// -----------------------------------------------------------------------------
// 🔮 THEME
// -----------------------------------------------------------------------------
const THEME = {
    bg: '#050505',
    primary: '#10b981',
    text: '#ffffff',
    textDim: '#a1a1aa',
};

// -----------------------------------------------------------------------------
// 〰️ WAVEFORM COMPONENT
// -----------------------------------------------------------------------------
const Waveform = () => {
    const [path, setPath] = useState('');

    useEffect(() => {
        let offset = 0;
        const interval = setInterval(() => {
            offset += 0.2;
            let d = `M 0 50`;
            for (let x = 0; x <= width; x += 10) {
                const y = 50 + 20 * Math.sin(x * 0.05 + offset) * Math.sin(x * 0.02); // Beats
                d += ` L ${x} ${y}`;
            }
            setPath(d);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.waveformContainer}>
            <View style={styles.waveHeader}>
                <Ionicons name="pulse" size={16} color={THEME.primary} />
                <Text style={styles.waveTitle}>BIO-METRICS LIVE</Text>
            </View>
            <Svg height="100" width={width} style={styles.svg}>
                <Path d={path} stroke={THEME.primary} strokeWidth="2" fill="none" />
                <Path d={path} stroke="rgba(16,185,129,0.2)" strokeWidth="6" fill="none" />
            </Svg>
            <LinearGradient
                colors={['transparent', THEME.bg]}
                style={[StyleSheet.absoluteFill, { top: 50 }]}
            />
        </View>
    );
};

// -----------------------------------------------------------------------------
// 🧬 DNA MARQUEE COMPONENT
// -----------------------------------------------------------------------------
const DNAMarquee = () => {
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(scrollX, {
                toValue: -1000,
                duration: 20000, // Slow scroll
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const sequence = "AGTC-GCTA-AGTC-GCTA-AGTC-GCTA-NNRA-SYS-ACTIVE-SEQ-001-INIT-AGTC-GCTA-".repeat(10);

    return (
        <View style={styles.dnaContainer}>
            <View style={styles.dnaLabelBox}>
                <Text style={styles.dnaLabel}>GENOMICS</Text>
            </View>
            <View style={{ overflow: 'hidden', flex: 1 }}>
                <Animated.Text style={[styles.dnaText, { transform: [{ translateX: scrollX }] }]}>
                    {sequence}
                </Animated.Text>
            </View>
            <View style={styles.scanLine} />
        </View>
    );
};

export default function CareScreen() {
    const [pulse] = useState(new Animated.Value(1));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[THEME.bg, '#000']} style={StyleSheet.absoluteFill} />

            {/* 🕸️ BACKGROUND MESH */}
            <View style={styles.bgGrid} pointerEvents="none" />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll}>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.statusRow}>
                            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
                            <Text style={styles.statusText}>AETHER CORE • V 2.4.0</Text>
                        </View>
                        <GlitchText text="SERVICE_MATRIX" style={styles.pageTitle} color={THEME.primary} />
                    </View>

                    {/* 1. CORE GRID */}
                    <View style={styles.grid}>
                        <BentoCard title="Aether AI" subtitle="Chat" icon="brain.head.profile" color="#8b5cf6" style={{ width: '48%' }} onPress={() => router.push('/(tabs)/chat')} delay={0} />
                        <BentoCard title="Scan AI" subtitle="Insight" icon="doc.text.viewfinder" color="#3b82f6" style={{ width: '48%' }} onPress={() => router.push('/(tabs)/analyze')} delay={100} />
                        <BentoCard title="Risk AI" subtitle="Analysis" icon="heart.fill" color="#ef4444" style={{ width: '48%' }} onPress={() => router.push('/(tabs)/risk')} delay={200} />
                        <BentoCard title="Care Net" subtitle="Nodes" icon="map.fill" color="#f59e0b" style={{ width: '48%' }} onPress={() => router.push('/(tabs)/clinics')} delay={300} />
                    </View>

                    {/* 2. WAVEFORM */}
                    <View style={styles.sectionSpacer} />
                    <Waveform />

                    {/* 3. DNA STREAM */}
                    <View style={styles.sectionSpacer} />
                    <DNAMarquee />

                    {/* 4. LIST MODULES */}
                    <View style={styles.listContainer}>
                        <View style={styles.listItem}>
                            <Ionicons name="eye" size={20} color="#06b6d4" />
                            <Text style={styles.listText}>VISION OPS</Text>
                            <Text style={styles.listStatus}>Stby</Text>
                        </View>
                        <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
                            <Ionicons name="moon" size={20} color="#8b5cf6" />
                            <Text style={styles.listText}>SLEEP LAB</Text>
                            <Text style={styles.listStatus}>Active</Text>
                        </View>
                    </View>

                    {/* 5. EMERGENCY SLIDER */}
                    <TouchableOpacity style={styles.sosContainer} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#7f1d1d', '#991b1b']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.sosGradient}
                        >
                            <View style={styles.sosIconBox}>
                                <Ionicons name="warning" size={24} color="#fff" />
                            </View>
                            <Text style={styles.sosText}>EMERGENCY OVERRIDE</Text>
                            <Ionicons name="chevron-forward-circle" size={24} color="#fff" style={{ opacity: 0.5 }} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.footerDisclaimer}>
                        MedNexus does not provide medical advice. Consult a doctor.
                    </Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    bgGrid: { position: 'absolute', width: '100%', height: '100%', opacity: 0.1, zIndex: -1 },
    scroll: { padding: 24, paddingBottom: 100 },
    header: { marginBottom: 24, marginTop: 10, alignItems: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
    statusText: { color: '#10b981', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    pageTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    sectionSpacer: { height: 24 },

    // Waveform
    waveformContainer: { height: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', paddingTop: 12, overflow: 'hidden' },
    waveHeader: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', gap: 8 },
    waveTitle: { color: THEME.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    svg: { position: 'absolute', bottom: 0, left: 0 },

    // DNA
    dnaContainer: { flexDirection: 'row', height: 48, borderRadius: 12, backgroundColor: 'rgba(236, 72, 153, 0.05)', alignItems: 'center', borderWidth: 1, borderColor: '#ec489930', overflow: 'hidden' },
    dnaLabelBox: { backgroundColor: '#ec489920', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    dnaLabel: { color: '#ec4899', fontSize: 10, fontWeight: '900' },
    dnaText: { color: '#ec4899', fontFamily: 'Courier', fontSize: 14, marginLeft: 16 },
    scanLine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, backgroundColor: 'rgba(5,5,5,0.8)' },

    // List
    listContainer: { marginTop: 24, backgroundColor: '#0a0a0a', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#333' },
    listItem: { flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 1, borderBottomColor: '#222', gap: 16 },
    listText: { color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1, letterSpacing: 1 },
    listStatus: { color: '#666', fontSize: 12, fontFamily: 'Courier' },

    // SOS
    sosContainer: { marginTop: 32, height: 64, borderRadius: 32, overflow: 'hidden', shadowColor: '#dc2626', shadowOpacity: 0.4, shadowRadius: 12 },
    sosGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, justifyContent: 'space-between' },
    sosIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    sosText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

    footerDisclaimer: { marginTop: 20, textAlign: 'center', color: '#64748b', fontSize: 10 },
});
