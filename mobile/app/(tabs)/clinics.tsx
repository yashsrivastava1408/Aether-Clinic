import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Linking, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Clinic = {
    id: string;
    name: string;
    address: string;
    distance: string;
    wait: string;
    phone: string;
    lat: number;
    lng: number;
};

// Mock Data
const CLINICS: Clinic[] = [
    { id: '1', name: 'Central City Hospital', address: '12 Health Blvd', distance: '1.2 km', wait: '10 min', phone: '1234567890', lat: 37.78825, lng: -122.4324 },
    { id: '2', name: 'Neuro-Spine Institute', address: '88 Neural Way', distance: '3.5 km', wait: '25 min', phone: '0987654321', lat: 37.75825, lng: -122.4624 },
    { id: '3', name: 'Aether Emergency Unit', address: '404 Void St', distance: '0.8 km', wait: '2 min', phone: '1122334455', lat: 37.74825, lng: -122.4124 },
    { id: '4', name: 'St. Mary Cardio', address: '50 Heartbeat Ln', distance: '5.1 km', wait: '45 min', phone: '5566778899', lat: 37.72825, lng: -122.4924 },
];

export default function ClinicsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const openMap = (lat: number, lng: number, label: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) Linking.openURL(url);
    };

    const callClinic = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030303' : '#f8fafc' }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Clinic Network</Text>
                <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyText}>LIVE UPDATES</Text>
                </View>
            </View>

            <FlatList
                data={CLINICS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: isDark ? '#ffffff0a' : '#fff' }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconCircle}>
                                <IconSymbol name="cross.fill" size={20} color="#ef4444" />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={[styles.clinicName, { color: isDark ? '#fff' : '#0f172a' }]}>{item.name}</Text>
                                <Text style={[styles.clinicAddress, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.address}</Text>
                            </View>
                            <View style={styles.distBadge}>
                                <Text style={styles.distText}>{item.distance}</Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: isDark ? '#ffffff1a' : '#e2e8f0' }]} />

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Est. Wait</Text>
                                <Text style={[styles.statValue, { color: item.wait.includes('min') && parseInt(item.wait) < 15 ? '#10b981' : '#f59e0b' }]}>
                                    {item.wait}
                                </Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: isDark ? '#ffffff10' : '#f1f5f9' }]}
                                    onPress={() => callClinic(item.phone)}
                                >
                                    <IconSymbol name="phone.fill" size={18} color={isDark ? '#fff' : '#334155'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navBtn, { backgroundColor: '#3b82f6' }]}
                                    onPress={() => openMap(item.lat, item.lng, item.name)}
                                >
                                    <IconSymbol name="location.fill" size={18} color="#fff" />
                                    <Text style={styles.navText}>Navigate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    emergencyBadge: { backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

    list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },

    card: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    cardHeader: { flexDirection: 'row', gap: 12 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef444420', alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    clinicName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    clinicAddress: { fontSize: 12 },
    distBadge: { justifyContent: 'center' },
    distText: { fontSize: 14, fontWeight: '600', color: '#10b981' },

    divider: { height: 1, marginVertical: 12 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stat: { gap: 2 },
    statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    statValue: { fontSize: 16, fontWeight: '700' },

    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    navBtn: { flexDirection: 'row', height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', gap: 6 },
    navText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
