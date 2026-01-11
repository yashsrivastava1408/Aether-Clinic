import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import MLResultGauge from '../../components/MLResultGauge';
import { Config } from '@/constants/Config';

const API_URL = Config.API_URL;

export default function RiskScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        age: '',
        sex: '1', // 1 = Male, 0 = Female
        cp: '0',
        trestbps: '',
        chol: '',
        fbs: '0',
        restecg: '0',
        thalach: '',
        exang: '0',
        oldpeak: '',
        slope: '1',
        ca: '0',
        thal: '2'
    });

    const updateForm = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const predictRisk = async () => {
        // Basic Validation
        if (!formData.age || !formData.trestbps || !formData.chol || !formData.thalach) {
            Alert.alert("Missing Data", "Please fill in all numerical fields.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Convert string inputs to numbers
            const payload = {
                features: [
                    parseInt(formData.age),
                    parseInt(formData.sex),
                    parseInt(formData.cp),
                    parseInt(formData.trestbps),
                    parseInt(formData.chol),
                    parseInt(formData.fbs),
                    parseInt(formData.restecg),
                    parseInt(formData.thalach),
                    parseInt(formData.exang),
                    parseFloat(formData.oldpeak || "0"),
                    parseInt(formData.slope),
                    parseInt(formData.ca),
                    parseInt(formData.thal)
                ]
            };

            // Using the /api/ml/heart endpoint which returns structured data
            const res = await axios.post(`${API_URL}/api/ml/heart`, payload);

            // Trigger Haptic Feedback
            if (res.data.risk_level === 'High') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            setResult(res.data);

        } catch (error) {
            console.error("ML Error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Error", "Could not analyze data. Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030303' : '#f8fafc' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Heart Risk AI</Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Predictive Cardiac Analysis
                    </Text>
                </View>

                {/* Result Card */}
                {result && (
                    <View style={[styles.resultCard, {
                        backgroundColor: isDark ? '#ffffff05' : '#fff',
                        borderColor: result.risk_level === 'High' ? '#ef444450' : '#10b98150',
                    }]}>
                        <MLResultGauge
                            percentage={result.risk_percentage}
                            level={result.risk_level}
                        />
                        <View style={[styles.badgeContainer, { backgroundColor: result.prediction ? '#ef444420' : '#10b98120' }]}>
                            <Text style={[styles.resultText, { color: result.prediction ? '#ef4444' : '#10b981' }]}>
                                {result.prediction ? "CARDIAC ANOMALY DETECTED" : "NO SIGNIFICANT ANOMALIES"}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Form Group: Personal */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Personal Metrics</Text>
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Age</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                            keyboardType="numeric"
                            placeholder="e.g. 45"
                            placeholderTextColor="#666"
                            value={formData.age}
                            onChangeText={v => updateForm('age', v)}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Sex</Text>
                        <View style={styles.switchRow}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, formData.sex === '1' && styles.segmentActive]}
                                onPress={() => updateForm('sex', '1')}
                            >
                                <Text style={[styles.segmentText, formData.sex === '1' && styles.segmentTextActive]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, formData.sex === '0' && styles.segmentActive]}
                                onPress={() => updateForm('sex', '0')}
                            >
                                <Text style={[styles.segmentText, formData.sex === '0' && styles.segmentTextActive]}>Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Form Group: Vitals */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Vital Signs</Text>
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Resting BP (mm Hg)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                            keyboardType="numeric"
                            placeholder="120"
                            placeholderTextColor="#666"
                            value={formData.trestbps}
                            onChangeText={v => updateForm('trestbps', v)}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Cholesterol</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                            keyboardType="numeric"
                            placeholder="200"
                            placeholderTextColor="#666"
                            value={formData.chol}
                            onChangeText={v => updateForm('chol', v)}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Max Heart Rate</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                            keyboardType="numeric"
                            placeholder="150"
                            placeholderTextColor="#666"
                            value={formData.thalach}
                            onChangeText={v => updateForm('thalach', v)}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Fasting Blood Sugar</Text>
                        <View style={styles.switchRow}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, formData.fbs === '1' && styles.segmentActive]}
                                onPress={() => updateForm('fbs', '1')}
                            >
                                <Text style={[styles.segmentText, formData.fbs === '1' && styles.segmentTextActive]}>{'>'}120</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, formData.fbs === '0' && styles.segmentActive]}
                                onPress={() => updateForm('fbs', '0')}
                            >
                                <Text style={[styles.segmentText, formData.fbs === '0' && styles.segmentTextActive]}>{'<'}120</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={[styles.predictBtn, { opacity: loading ? 0.7 : 1 }]}
                    onPress={predictRisk}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.predictBtnText}>RUN ANALYSIS</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 40 },
    header: { marginBottom: 24 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    headerSubtitle: { fontSize: 16, marginTop: 4 },

    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 12 },

    row: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    halfInput: { flex: 1 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
    input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },

    switchRow: { flexDirection: 'row', height: 48, backgroundColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
    segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    segmentActive: { backgroundColor: '#10b981' },
    segmentText: { color: '#64748b', fontWeight: '600', fontSize: 12 },
    segmentTextActive: { color: '#fff' },

    spacer: { height: 24 },

    predictBtn: { backgroundColor: '#ef4444', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    predictBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },

    resultCard: { padding: 32, borderRadius: 24, borderWidth: 1, alignItems: 'center', gap: 24, marginBottom: 32, overflow: 'hidden' },
    badgeContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    resultText: { fontSize: 13, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 }
});
