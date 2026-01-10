import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (width - 48 - GRID_GAP) / 2;

// -----------------------------------------------------------------------------
// 🔮 VISUAL CONSTANTS
// -----------------------------------------------------------------------------
const THEME = {
  dark: {
    bg: '#050505',
    card: '#0a0a0a',
    border: 'rgba(255, 255, 255, 0.1)',
    primary: '#10b981', // Emerald 500
    primaryDim: 'rgba(16, 185, 129, 0.1)',
    text: '#ffffff',
    textDim: '#a1a1aa',
    accent: '#3b82f6', // Blue
  },
};

// -----------------------------------------------------------------------------
// 🧩 COMPONENTS
// -----------------------------------------------------------------------------

const HolographicCorner = ({ style, color }: { style?: any, color: string }) => (
  <View style={[styles.corner, { borderColor: color }, style]} />
);

// 📟 Glitch Text Component (Reused for consistent branding)
const GlitchText = ({ text, style, color }: { text: string, style?: any, color: string }) => {
  const [glitchFactor, setGlitchFactor] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchFactor(Math.random() * 5);
        setTimeout(() => setGlitchFactor(0), 100);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text style={[style, { color: color }]}>{text}</Text>
      {glitchFactor > 0 && (
        <Text style={[style, { position: 'absolute', top: 0, left: 0, color: 'red', opacity: 0.5, transform: [{ translateX: glitchFactor }, { translateY: -glitchFactor / 2 }] }]}>{text}</Text>
      )}
      {glitchFactor > 0 && (
        <Text style={[style, { position: 'absolute', top: 0, left: 0, color: 'cyan', opacity: 0.5, transform: [{ translateX: -glitchFactor }, { translateY: glitchFactor / 2 }] }]}>{text}</Text>
      )}
    </View>
  );
};

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  color: string;
  onPress: () => void;
  size?: 'small' | 'large';
  delay?: number;
}

const BentoCard = ({ title, subtitle, icon, color, onPress, size = 'small', delay = 0 }: BentoCardProps) => {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Initial Entrance
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.bentoCardWrapper,
      size === 'large' ? styles.cardLarge : styles.cardSmall,
      { opacity, transform: [{ scale }] }
    ]}>
      <TouchableOpacity
        style={[styles.bentoCard, { borderColor: color + '30' }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[color + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <IconSymbol name={icon} size={24} color={color} />
          </View>
          <IconSymbol name="arrow.up.right" size={16} color={color + '60'} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const colors = THEME.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle='light-content' />

      <LinearGradient
        colors={[colors.bg, '#080808', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Grid */}
      <View style={styles.bgGrid} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>
        <HolographicCorner style={{ top: 20, left: 24, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 }} color={colors.primary} />
        <HolographicCorner style={{ top: 20, right: 24, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 }} color={colors.primary} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <GlitchText text="CORE_SERVICES" style={styles.headerTitle} color={colors.primary} />
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 4 }}>ACCESS NEURAL MODULES</Text>
          </View>

          {/* BENTO GRID MENU (Moved from Home) */}
          <View style={styles.gridContainer}>
            <BentoCard
              title="Dr. AI"
              subtitle="Consultation"
              icon="brain.head.profile"
              color={colors.accent}
              onPress={() => router.push('/(tabs)/chat')}
              delay={100}
            />
            <BentoCard
              title="Analyzer"
              subtitle="Report Scan"
              icon="doc.viewfinder"
              color={colors.primary}
              onPress={() => router.push('/(tabs)/analyze')}
              delay={200}
            />
            <BentoCard
              title="Network"
              subtitle="Find Clinics"
              icon="map.fill"
              color="#f59e0b" // Amber
              onPress={() => router.push('/(tabs)/clinics')}
              delay={300}
            />
            <BentoCard
              title="Risk Guard"
              subtitle="Prediction"
              icon="heart.text.square"
              color="#ef4444" // Red
              onPress={() => router.push('/(tabs)/risk')}
              delay={400}
            />
          </View>

          {/* Extra Service or Future Module Placeholders could go here */}

          <View style={{ marginTop: 32, padding: 24, borderRadius: 24, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <IconSymbol name="lock.fill" size={20} color={colors.accent} />
              <Text style={{ color: colors.text, fontWeight: 'bold', marginLeft: 10, fontSize: 16 }}>Secure Vault</Text>
            </View>
            <Text style={{ color: colors.textDim, lineHeight: 20 }}>
              All medical records and consultations are encrypted with AES-256 standard. Your data privacy is our primary directive.
            </Text>
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

  header: { marginBottom: 32, marginTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  bentoCardWrapper: { width: CARD_WIDTH, marginBottom: GRID_GAP },
  cardLarge: { width: '100%' },
  cardSmall: { width: CARD_WIDTH },
  bentoCard: {
    height: 140, borderRadius: 24, padding: 16, borderWidth: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: {},
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#94a3b8' },
});
