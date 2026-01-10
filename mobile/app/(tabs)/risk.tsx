import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

// Using the same reliable IP address
const API_URL = 'http://192.168.1.6:5050';

export default function RiskScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

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
                age: parseInt(formData.age),
                sex: parseInt(formData.sex),
                cp: parseInt(formData.cp),
                trestbps: parseInt(formData.trestbps),
                chol: parseInt(formData.chol),
                fbs: parseInt(formData.fbs),
                restecg: parseInt(formData.restecg),
                thalach: parseInt(formData.thalach),
                exang: parseInt(formData.exang),
                oldpeak: parseFloat(formData.oldpeak || "0"),
                slope: parseInt(formData.slope),
                ca: parseInt(formData.ca),
                thal: parseInt(formData.thal)
            };

            const res = await axios.post(`${API_URL}/api/ml/predict_heart_disease`, payload);

            // Backend returns: { prediction: "Heart Disease Detected" } or "No Heart Disease..."
            setResult(res.data.prediction);

        } catch (error) {
            console.error("ML Error:", error);
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
                        backgroundColor: result.includes('No') ? '#10b98120' : '#ef444420',
                        borderColor: result.includes('No') ? '#10b981' : '#ef4444'
                    }]}>
                        <IconSymbol
                            name={result.includes('No') ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"}
                            size={40}
                            color={result.includes('No') ? '#10b981' : '#ef4444'}
                        />
                        <Text style={[styles.resultText, { color: result.includes('No') ? '#10b981' : '#ef4444' }]}>
                            {result}
                        </Text>
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

    resultCard: { padding: 24, borderRadius: 20, borderWidth: 2, alignItems: 'center', gap: 12, marginBottom: 32 },
    resultText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
});
