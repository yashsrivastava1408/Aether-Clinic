import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';

const { width } = Dimensions.get('window');

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

// 📟 Friendly Glitch Text
const GlitchText = ({ text, style, color }: { text: string, style?: any, color: string }) => {
  const [glitchFactor, setGlitchFactor] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.98) {
        setGlitchFactor(Math.random() * 3);
        setTimeout(() => setGlitchFactor(0), 100);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text style={[style, { color: color }]}>{text}</Text>
      {glitchFactor > 0 && (
        <Text style={[style, { position: 'absolute', top: 0, left: 0, color: 'rgba(255,255,255,0.8)', opacity: 0.7, transform: [{ translateX: glitchFactor * 0.5 }, { translateY: -glitchFactor / 4 }] }]}>{text}</Text>
      )}
    </View>
  );
};

// 🧘 Chill Quotes Component
const ChillQuotes = ({ color }: { color: string }) => {
  const QUOTES = [
    "KEEP CALM",
    "WE GOT THIS",
    "JUST BREATHE",
    "STAY POSITIVE",
    "ALL IS WELL"
  ];
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = () => {
      // Fade Out
      Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start(() => {
        setIndex((prev) => (prev + 1) % QUOTES.length);
        // Fade In
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
      });
    };

    // Initial fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    const interval = setInterval(cycle, 4000); // Change every 4s
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 3, textAlign: 'center', color: color }}>
        {QUOTES[index]}
      </Text>
    </Animated.View>
  );
};


// 💧 LIQUID ENERGY COMPONENT (CRAZY OPTION 4)
const LiquidBlob = ({ color, size, duration, delay, reverse }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: reverse ? ['0deg', '-180deg'] : ['0deg', '180deg'] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }); // Gentle wobble

  return (
    <Animated.View style={[
      styles.liquidBlob,
      {
        width: size, height: size, borderRadius: size / 2, backgroundColor: color,
        transform: [{ scale }, { rotate }, { translateX }]
      }
    ]} />
  );
};

const LiquidCore = ({ color, accent }: { color: string, accent: string }) => {
  return (
    <View style={styles.liquidContainer}>
      {/* Multiple overlapping blobs to create "liquid" effect */}
      <View style={{ position: 'absolute', opacity: 0.3 }}>
        <LiquidBlob color={color} size={180} duration={8000} delay={0} />
      </View>
      <View style={{ position: 'absolute', opacity: 0.4 }}>
        <LiquidBlob color={accent} size={160} duration={12000} delay={1000} reverse />
      </View>
      <View style={{ position: 'absolute', opacity: 0.5 }}>
        <LiquidBlob color={color} size={140} duration={6000} delay={500} />
      </View>

      {/* Central Glow */}
      <View style={[styles.singularity, { shadowColor: color, width: 60, height: 60, borderRadius: 30, borderWidth: 0, backgroundColor: '#fff', opacity: 0.9, shadowOpacity: 0.5, shadowRadius: 30 }]} />

      {/* Floating particles around it */}
      {[...Array(6)].map((_, i) => (
        <View key={i} style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${i * 60}deg` }] }}>
            <View style={{ width: 4, height: 4, backgroundColor: color, borderRadius: 2, transform: [{ translateY: -100 }] }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ✨ Daily Insight Component
const DailyInsight = ({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      delay: 500,
      useNativeDriver: true
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(starSpin, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(starSpin, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const starOpacity = starSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });
  const starScale = starSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] });

  return (
    <Animated.View style={[styles.insightCard, { borderColor: colors.accent, backgroundColor: colors.accent + '10', opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Animated.View style={{ opacity: starOpacity, transform: [{ scale: starScale }] }}>
          <IconSymbol name="star.fill" size={16} color={colors.accent} />
        </Animated.View>
        <Text style={{ color: colors.accent, fontWeight: 'bold', marginLeft: 8, fontSize: 12 }}>DAILY INSIGHT</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
        "Staying hydrated boosts your cognitive performance. You're closely tracking your goal today—excellent work!"
      </Text>
    </Animated.View>
  );
};


// -----------------------------------------------------------------------------
// 🚀 MAIN SCREEN
// -----------------------------------------------------------------------------

export default function HomeScreen() {
  const isDark = true;
  const colors = THEME.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle='light-content' />

      <LinearGradient
        colors={[colors.bg, '#080808', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGrid} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>

        <HolographicCorner style={{ top: 60, left: 24, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 }} color={colors.primary} />
        <HolographicCorner style={{ top: 60, right: 24, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 }} color={colors.primary} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* HEADER SECTION */}
          <View style={styles.header}>
            <View>
              <View style={styles.systemBadge}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.systemText, { color: colors.primary }]}>Online • Ready to Help</Text>
              </View>
              <Text style={[styles.greeting, { color: colors.textDim }]}>Good Afternoon,</Text>

              <GlitchText
                text="Yash Srivastava"
                style={styles.userName}
                color={colors.text}
              />
            </View>
            <TouchableOpacity style={[styles.profileButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <IconSymbol name="person.crop.circle" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* 💧 HERO: LIQUID ENERGY - WITH CHILL QUOTES */}
          <Animated.View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, height: 300, justifyContent: 'center' }]}>
            <LinearGradient
              colors={[colors.primary + '05', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <LiquidCore color={colors.primary} accent={colors.accent} />

              {/* Floating Text Overlay with Chill Quotes */}
              <View style={{ position: 'absolute', bottom: 40 }}>
                <ChillQuotes color={colors.text} />
              </View>
            </View>

          </Animated.View>

          {/* DAILY WELLNESS TIP */}
          <DailyInsight colors={colors} />

          {/* APP OVERVIEW SECTION */}
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>How I Can Help</Text>

            <View style={{ gap: 16 }}>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                  <IconSymbol name="brain.head.profile" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Chat with Dr. AI</Text>
                  <Text style={[styles.featureDesc, { color: colors.textDim }]}>Feeling unwell? Describe your symptoms and get instant advice.</Text>
                </View>
              </View>

              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol name="doc.viewfinder" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Understand Reports</Text>
                  <Text style={[styles.featureDesc, { color: colors.textDim }]}>Scan your medical docs or X-rays. I'll explain them in plain English.</Text>
                </View>
              </View>

              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#f59e0b20' }]}>
                  <IconSymbol name="map.fill" size={20} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Find Nearby Care</Text>
                  <Text style={[styles.featureDesc, { color: colors.textDim }]}>Locate the best clinics, specialists, and pharmacies near you.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Action / CTA */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: 24 }]}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: '#000' }]}>Start a Checkup</Text>
              <Text style={[styles.actionSubtitle, { color: '#000', opacity: 0.7 }]}>Tap to access all health tools</Text>
            </View>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,0,0,0.1)', width: 40, height: 40 }]}>
              <IconSymbol name="arrow.right" size={20} color="#000" />
            </View>
          </TouchableOpacity>

        </ScrollView>

        <View style={[styles.footer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
          <Text style={[styles.footerText, { color: colors.primary }]}>SECURE • ENCRYPTED • PRIVATE</Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGrid: { position: 'absolute', width: '100%', height: '100%', zIndex: -1, opacity: 0.1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  corner: { position: 'absolute', width: 24, height: 24, opacity: 0.6 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 16 },
  systemBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  systemText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, fontWeight: '700' },
  greeting: { fontSize: 14, fontWeight: '400', letterSpacing: 0.5 },
  userName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, textTransform: 'capitalize' },
  profileButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  heroCard: { borderRadius: 24, padding: 24, borderWidth: 1, marginBottom: 24, overflow: 'hidden', height: 300 },
  heroTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  // Liquid Styles
  liquidContainer: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  liquidBlob: { position: 'absolute', opacity: 0.4 },
  singularity: { position: 'absolute', zIndex: 10 },

  insightCard: { marginVertical: 8, padding: 16, borderRadius: 16, borderWidth: 1 },

  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 },

  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureTitle: { fontSize: 16, fontWeight: 'bold' },
  featureDesc: { fontSize: 13, marginTop: 2, width: '95%', lineHeight: 18 },

  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 16, fontWeight: 'bold' },
  actionSubtitle: { fontSize: 12 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, borderTopWidth: 1, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  footerText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.7, letterSpacing: 1 },
});
