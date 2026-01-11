import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlitchText } from '@/components/ui/GlitchText';
import { SearchBar } from '@/components/ui/SearchBar';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { HolographicGlobe } from '@/components/explore/HolographicGlobe';
import { router } from 'expo-router';

// -----------------------------------------------------------------------------
// 🔮 THEME & DATA
// -----------------------------------------------------------------------------
const THEME = {
  bg: '#050505',
  card: '#0a0a0a',
  primary: '#10b981',
  text: '#ffffff',
  textDim: '#a1a1aa',
};

const TOPICS = [
  { id: '1', label: 'Neural' },
  { id: '2', label: 'Cardio' },
  { id: '3', label: 'Dental' },
  { id: '4', label: 'Ortho' },
  { id: '5', label: 'Vision' },
  { id: '6', label: 'Psych' },
];

export default function ExploreScreen() {
  const [activeTopic, setActiveTopic] = useState('1');

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

          {/* 🌍 GLOBAL SCANNER */}
          <HolographicGlobe />

          <View style={styles.header}>
            <GlitchText text="GLOBAL_NET" style={styles.pageTitle} color={THEME.primary} />
            <Text style={styles.pageSubtitle}>Connected to Mainframe</Text>
          </View>

          {/* SEARCH */}
          <SearchBar placeholder="Query symptoms, clinics..." />

          {/* TOPICS SCROLL */}
          <View style={styles.topicContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
              {TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => setActiveTopic(topic.id)}
                  style={[
                    styles.topicChip,
                    activeTopic === topic.id && styles.topicChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.topicText,
                      activeTopic === topic.id && styles.topicTextActive,
                    ]}
                  >
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 📡 ACTIVE RADAR */}
          <View style={styles.sectionHeader}>
            <Ionicons name="radio" size={18} color={THEME.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>NEARBY_NODES</Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={styles.radarCard}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'transparent']}
              style={styles.radarGradient}
            >
              <View style={[styles.radarCircle, { width: 100, height: 100, borderColor: 'rgba(16,185,129,0.3)' }]} />
              <View style={[styles.radarCircle, { width: 60, height: 60, borderColor: 'rgba(16,185,129,0.5)' }]} />
              <Ionicons name="navigate-circle" size={40} color={THEME.primary} />
              <View style={styles.radarInfo}>
                <Text style={styles.radarTitle}>3 Clinics Detected</Text>
                <Text style={styles.radarSubtitle}>Within 5km radius</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 👨‍⚕️ SPECIALISTS FEED */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Ionicons name="people" size={18} color="#f472b6" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>TOP_SPECIALISTS</Text>
          </View>

          <DoctorCard
            name="Dr. Sarah Chen"
            specialty="Neural Systems Expert"
            rating={4.9}
            reviews={128}
            onPress={() => { }}
          />
          <DoctorCard
            name="Dr. Marcus Webb"
            specialty="Bio-Cardiologist"
            rating={4.8}
            reviews={85}
            onPress={() => { }}
          />
          <DoctorCard
            name="Dr. Emily Vance"
            specialty="Cyber-Psychology"
            rating={5.0}
            reviews={204}
            onPress={() => { }}
          />
          <DoctorCard
            name="Dr. Ael Wilson"
            specialty="Nano-Surgeon"
            rating={4.7}
            reviews={92}
            onPress={() => { }}
          />

        </ScrollView>
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
  },
  scroll: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
    marginTop: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pageSubtitle: {
    fontSize: 14,
    color: THEME.textDim,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Topics
  topicContainer: {
    marginBottom: 32,
  },
  topicsScroll: {
    paddingHorizontal: 20,
  },
  topicChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topicChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  topicText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  topicTextActive: {
    color: '#10b981',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // Radar
  radarCard: {
    height: 160,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    marginHorizontal: 20,
  },
  radarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    opacity: 0.5,
  },
  radarInfo: {
    position: 'absolute',
    bottom: 16,
    alignItems: 'center',
  },
  radarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  radarSubtitle: {
    color: '#34d399',
    fontSize: 12,
  },
});
