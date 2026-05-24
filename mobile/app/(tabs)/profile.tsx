import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { GlitchText } from '@/components/ui/GlitchText';
import { useAuth } from '@/context/AuthContext';

const THEME = {
    bg: '#050505',
    card: '#0a0a0a',
    primary: '#10b981',
    text: '#ffffff',
    textDim: '#a1a1aa',
};

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[THEME.bg, '#000']}
                style={StyleSheet.absoluteFill}
            />

            {/* 🕸️ BACKGROUND MESH */}
            <View style={styles.bgGrid} pointerEvents="none" />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll}>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <GlitchText text="IDENTITY_CORE" style={styles.pageTitle} color={THEME.primary} />
                        <Text style={styles.pageSubtitle}>Biometric Profile Active</Text>
                    </View>

                    {/* 🦸 HERO PROFILE */}
                    <View style={styles.profileHeader}>
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.2)', 'transparent']}
                            style={styles.avatarContainer}
                        >
                            <Ionicons name="person" size={48} color={THEME.primary} />
                            <View style={[styles.onlineDot, { backgroundColor: THEME.primary }]} />
                        </LinearGradient>
                        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.userId}>ID: {user?.id.slice(0, 12).toUpperCase()}</Text>
                        {user?.isGuest && (
                            <TouchableOpacity style={styles.signInBadge} onPress={() => router.push('/login')}>
                                <Text style={styles.signInText}>SECURE ACCOUNT</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 📊 STATS GRID */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>AGE</Text>
                            <Text style={styles.statValue}>24</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>TYPE</Text>
                            <Text style={styles.statValue}>O+</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>HEIGHT</Text>
                            <Text style={styles.statValue}>182<Text style={{ fontSize: 12 }}>cm</Text></Text>
                        </View>
                    </View>

                    {/* ⚙️ MENU ITEMS */}
                    <View style={styles.menuContainer}>
                        <MenuOption icon="document-text-outline" label="Medical Records" sub="Encrypted History" />
                        <MenuOption icon="fitness-outline" label="Vitals Log" sub="Last check: 2h ago" />
                        <MenuOption icon="settings-outline" label="Neural Settings" sub="Notifications, Privacy" />

                        {/* ⚖️ LEGAL & SAFETY */}
                        <View style={styles.sectionSpacer}>
                            <Text style={styles.sectionTitle}>LEGAL & SAFETY</Text>
                        </View>

                        <View style={styles.legalCard}>
                            {/* MEDICAL */}
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Medical Disclaimer</Text>
                                <Text style={styles.legalText}>
                                    MedNexus provides AI-assisted health information and educational insights only.
                                    It does not provide medical advice, diagnosis, prescriptions, or treatment.
                                    Always consult a qualified healthcare professional for medical concerns.
                                </Text>
                            </View>

                            {/* EMERGENCY */}
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Emergency Notice</Text>
                                <Text style={styles.legalText}>
                                    MedNexus is not designed for medical emergencies.
                                    If you experience severe or urgent symptoms, contact local emergency services or visit the nearest hospital immediately.
                                </Text>
                            </View>

                            {/* DATA */}
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Data & Privacy Notice</Text>
                                <Text style={styles.legalText}>
                                    Your data is encrypted and handled securely.
                                    MedNexus does not share personal health information without user consent.
                                </Text>
                            </View>

                            {/* TERMS */}
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Terms of Service</Text>
                                <Text style={styles.legalText}>
                                    By using this app, you agree to our Terms of Service.
                                    Unauthorized use of the Neural Core API is prohibited.
                                </Text>
                            </View>

                            {/* LICENSES */}
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Third Party Licenses</Text>
                                <Text style={styles.legalText}>
                                    This software uses open source components including React Native, Expo, and others.
                                    Full license text available in Settings.
                                </Text>
                            </View>

                            {/* AI LIMITATIONS */}
                            <View style={[styles.legalItem, { borderBottomWidth: 0 }]}>
                                <Text style={styles.legalTitle}>AI Limitations (Hallucinations)</Text>
                                <Text style={styles.legalText}>
                                    Generative AI models may produce inaccurate or hallucinated information.
                                    Always verify critical health data with a medical professional.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.logoutBtn}>
                            <Text style={styles.logoutText}>DISCONNECT LINK</Text>
                        </TouchableOpacity>

                        <Text style={styles.versionText}>MedNexus Mobile v1.0.0 (Build 2026.1)</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const MenuOption = ({ icon, label, sub }: { icon: any, label: string, sub: string }) => (
    <TouchableOpacity style={styles.menuOption}>
        <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>{label}</Text>
            <Text style={styles.menuSub}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#333" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
    },
    bgGrid: {
        position: 'absolute', width: '100%', height: '100%', opacity: 0.1, zIndex: -1,
    },
    scroll: {
        padding: 24,
        paddingBottom: 100,
    },
    header: { alignItems: 'center', marginBottom: 32 },
    pageTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    pageSubtitle: { fontSize: 12, color: THEME.textDim, marginTop: 4, letterSpacing: 1 },

    profileHeader: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: {
        width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        position: 'relative',
    },
    onlineDot: {
        width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: 4, right: 14,
        borderWidth: 2, borderColor: '#000',
    },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    userId: { fontSize: 12, color: THEME.textDim, letterSpacing: 1 },

    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    statCard: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center',
    },
    statLabel: { fontSize: 10, color: THEME.textDim, fontWeight: 'bold', marginBottom: 4 },
    statValue: { fontSize: 20, color: '#fff', fontWeight: 'bold' },

    menuContainer: { gap: 12 },
    menuOption: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)', gap: 16,
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
    menuSub: { fontSize: 12, color: '#666' },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
    logoutBtn: {
        padding: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    logoutText: { color: '#ef4444', fontWeight: 'bold', letterSpacing: 1, fontSize: 12 },

    sectionSpacer: { marginTop: 24, marginBottom: 8 },
    sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, paddingLeft: 4 },
    legalCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' },
    legalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    legalTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
    legalText: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
    versionText: { textAlign: 'center', color: '#555', fontSize: 10, marginTop: 24, letterSpacing: 1 },
    signInBadge: {
        marginTop: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    signInText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
