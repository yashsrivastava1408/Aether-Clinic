import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Dimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, withDelay } from 'react-native-reanimated';

import { BentoCard } from '@/components/ui/BentoCard';
import { GlitchText } from '@/components/ui/GlitchText';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width, height } = Dimensions.get('window');
const GRID_GAP = 12;

/* -------------------------------------------------------------------------- */
/*                                   THEME                                    */
/* -------------------------------------------------------------------------- */
const THEME = {
  dark: {
    bg: '#050505',
    card: '#0a0a0a',
    border: 'rgba(255, 255, 255, 0.1)',
    primary: '#10b981',
    accent: '#3b82f6',
    textDim: '#a1a1aa',
  },
};

const HolographicCorner = ({ style, color }: { style?: any, color: string }) => (
  <View style={[styles.corner, { borderColor: color }, style]} />
);

/* -------------------------------------------------------------------------- */
/*                       AETHER COMMAND CARD (FLEX LAYOUT)                    */
/* -------------------------------------------------------------------------- */
const AetherCommandCard = () => {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: pulse.value }]
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(tabs)/chat');
      }}
      style={styles.commandCard}
    >
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.15)', 'rgba(5, 5, 5, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow Border */}
      <View style={styles.commandBorder} />

      {/* Content Container with Flex Layout */}
      <View style={styles.commandContainer}>
        {/* Header Row */}
        <View style={styles.commandHeader}>
          <View style={styles.iconBox}>
            <IconSymbol name="brain.head.profile" size={24} color="#60a5fa" />
          </View>
          <View style={styles.statusBox}>
            <Animated.View style={[styles.statusDot, dotStyle]} />
            <Text style={styles.statusText}>NEURAL LINK ACTIVE</Text>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.commandBottom}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={styles.commandTitle} numberOfLines={1} adjustsFontSizeToFit>AETHER AI</Text>
            <Text style={styles.commandSubtitle} numberOfLines={1}>Ask anything, anytime.</Text>
          </View>

          <View style={styles.enterButton}>
            <IconSymbol name="arrow.right" size={20} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/*                          DIGITAL AURORA (BREATHING BG)                     */
/* -------------------------------------------------------------------------- */
const AuroraBackground = () => {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={['#050505', '#064e3b', '#050505']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                          AMBIENT FIREFLIES                                 */
/* -------------------------------------------------------------------------- */
const Firefly = ({ index }: { index: number }) => {
  const randomX = Math.random() * width;
  const randomY = Math.random() * height;
  const size = Math.random() * 4 + 2;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const duration = 3000 + Math.random() * 3000;
    const delay = Math.random() * 2000;

    opacity.value = withDelay(delay, withRepeat(withSequence(
      withTiming(Math.random() * 0.6 + 0.2, { duration: duration / 2 }),
      withTiming(0, { duration: duration / 2 })
    ), -1, true));

    translateY.value = withDelay(delay, withRepeat(
      withTiming(-50 - Math.random() * 50, { duration: duration, easing: Easing.linear }),
      -1, false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: randomX,
          top: randomY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: index % 2 === 0 ? '#10b981' : '#3b82f6'
        }
      ]}
    />
  );
};

const AmbientFireflies = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 15 }).map((_, i) => (
        <Firefly key={i} index={i} />
      ))}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                          HYPER SCRAMBLE ANIMATION                          */
/* -------------------------------------------------------------------------- */
const CHARS = '!<>-_\\/[]{}—=+*^?#________';

const HyperScramble = ({ text, style }: { text: string, style: any }) => {
  const [displayText, setDisplayText] = useState(
    text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  );
  const iterations = useRef(0);
  const hasFinished = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(() =>
        text.split('').map((char, index) => {
          if (index < iterations.current) {
            return text[index];
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );

      if (iterations.current >= text.length) {
        clearInterval(interval);
        if (!hasFinished.current) {
          hasFinished.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      iterations.current += 1 / 2;
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <Text style={style}>
      {displayText}
    </Text>
  );
};

/* -------------------------------------------------------------------------- */
/*                          THE SENTIENT CORE (TEXT)                          */
/* -------------------------------------------------------------------------- */
const SentientCore = () => {
  return (
    <View style={styles.coreContainer}>
      <View style={styles.coreGlow} />

      {/* The Text Logo with Hyper Scramble */}
      <View style={{ transform: [{ scale: 1.0 }] }}>
        <HyperScramble
          text="MEDNEXUS"
          style={styles.coreTitle}
        />
      </View>

      <Text style={styles.coreLabel}>YOUR PERSONAL HEALTH COMPANION</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                          DAILY PROTOCOL (QUOTE)                            */
/* -------------------------------------------------------------------------- */
const DailyProtocol = () => (
  <View style={styles.quoteCard}>
    <View style={styles.quoteHeader}>
      <Text style={styles.quoteLabel}>DAILY INSIGHT</Text>
      <View style={styles.decorLine} />
    </View>
    <Text style={styles.quoteText}>
      "Your health is a journey of understanding. We are here to provide clarity and calm at every step."
    </Text>
    <Text style={styles.quoteAuthor}>MedNexus</Text>
  </View>
);

export default function HomeScreen() {
  const colors = THEME.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* 🌌 BACKGROUND LAYERS */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      <AuroraBackground />
      <AmbientFireflies />
      <View style={styles.bgGrid} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>

        {/* Holographic Corners */}
        <HolographicCorner style={{ top: 20, left: 24, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 }} color={colors.primary} />
        <HolographicCorner style={{ top: 20, right: 24, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 }} color={colors.primary} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSub}>WELCOME BACK</Text>
              <GlitchText text="HELLO YASH" style={styles.greeting} color="#fff" />
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>

          {/* 🌑 SENTIENT CORE */}
          <SentientCore />

          {/* 📜 DAILY PROTOCOL */}
          <DailyProtocol />

          {/* 📂 PRIMARY COMMAND (ENHANCED) */}
          <View style={styles.primaryCommand}>
            <AetherCommandCard />
          </View>

          {/* 🛡️ TRUST PROTOCOL */}
          <View style={styles.confidenceBox}>
            <Text style={styles.confidenceText}>
              "Dedicated to your well-being.
              Secure, private, and always available to guide you."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <IconSymbol name="shield.fill" size={12} color="#10b981" />
              <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>SECURE • PRIVATE</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGrid: { position: 'absolute', width: '100%', height: '100%', zIndex: -1, opacity: 0.1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  corner: { position: 'absolute', width: 24, height: 24, opacity: 0.6 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  greetingSub: { fontSize: 12, color: THEME.dark.primary, letterSpacing: 1.5, marginBottom: 4, fontWeight: '700' },
  greeting: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  statusText: { color: '#10b981', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  // Sentient Core
  coreContainer: { alignItems: 'center', justifyContent: 'center', height: 200, marginBottom: 24, position: 'relative', marginTop: 32 },
  coreGlow: { position: 'absolute', width: '80%', height: 100, borderRadius: 50, backgroundColor: '#10b981', opacity: 0.15 },
  coreTitle: { fontSize: 36, fontWeight: '900', letterSpacing: 2, textAlign: 'center', color: '#fff' },
  coreLabel: { position: 'absolute', bottom: 10, color: '#10b981', fontSize: 10, letterSpacing: 3, fontWeight: 'bold', opacity: 0.8 },

  // Quote
  quoteCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quoteLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  decorLine: { height: 1, flex: 1, backgroundColor: '#333', marginLeft: 12 },
  quoteText: { color: '#e2e8f0', fontSize: 18, fontStyle: 'italic', fontWeight: '500', lineHeight: 28 },
  quoteAuthor: { color: '#10b981', fontSize: 12, marginTop: 12, textAlign: 'right', fontWeight: 'bold', letterSpacing: 1 },

  // Primary & Trust
  primaryCommand: { marginBottom: 24 },
  confidenceBox: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 32 },
  confidenceText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },

  // Command Card Styles
  commandCard: {
    height: 160,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  commandContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between', // Pushes Header up, Bottom down
  },
  commandBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)', // Blue accent
    borderRadius: 24,
  },
  commandHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commandBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },

  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { color: '#60a5fa', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  commandTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  commandSubtitle: { color: '#93c5fd', fontSize: 14, marginTop: 4 },

  enterButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 10,
  },

  sectionTitle: { fontSize: 14, color: THEME.dark.textDim, letterSpacing: 2, marginBottom: 16, fontWeight: '600' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
});