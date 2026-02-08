import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
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
    const [mode, setMode] = useState<'heart' | 'diabetes'>('heart');

    // Form States
    const [heartData, setHeartData] = useState({
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

    const [diabetesData, setDiabetesData] = useState({
        pregnancies: '',
        glucose: '',
        bp: '',
        skin: '',
        insulin: '',
        bmi: '',
        dpf: '',
        age: ''
    });

    const updateHeartForm = (key: string, value: string) => {
        setHeartData(prev => ({ ...prev, [key]: value }));
    };

    const updateDiabetesForm = (key: string, value: string) => {
        setDiabetesData(prev => ({ ...prev, [key]: value }));
    };

    const predictRisk = async () => {
        if (mode === 'heart') {
            if (!heartData.age || !heartData.trestbps || !heartData.chol || !heartData.thalach) {
                Alert.alert("Missing Data", "Please fill in all numerical fields.");
                return;
            }
        } else {
            if (!diabetesData.glucose || !diabetesData.bp || !diabetesData.bmi || !diabetesData.age) {
                Alert.alert("Missing Data", "Please fill in key metabolic fields (Glucose, BP, BMI, Age).");
                return;
            }
        }

        setLoading(true);
        setResult(null);

        try {
            let payload, endpoint;

            if (mode === 'heart') {
                endpoint = `${API_URL}/api/ml/heart`;
                payload = {
                    features: [
                        parseInt(heartData.age),
                        parseInt(heartData.sex),
                        parseInt(heartData.cp),
                        parseInt(heartData.trestbps),
                        parseInt(heartData.chol),
                        parseInt(heartData.fbs),
                        parseInt(heartData.restecg),
                        parseInt(heartData.thalach),
                        parseInt(heartData.exang),
                        parseFloat(heartData.oldpeak || "0"),
                        parseInt(heartData.slope),
                        parseInt(heartData.ca),
                        parseInt(heartData.thal)
                    ]
                };
            } else {
                endpoint = `${API_URL}/api/ml/diabetes`;
                payload = {
                    features: [
                        parseInt(diabetesData.pregnancies || "0"),
                        parseInt(diabetesData.glucose),
                        parseInt(diabetesData.bp),
                        parseInt(diabetesData.skin || "0"),
                        parseInt(diabetesData.insulin || "0"),
                        parseFloat(diabetesData.bmi),
                        parseFloat(diabetesData.dpf || "0.5"),
                        parseInt(diabetesData.age)
                    ]
                };
            }

            const res = await axios.post(endpoint, payload);

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
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                        {mode === 'heart' ? 'Heart Health AI' : 'Diabetes Risk AI'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {mode === 'heart' ? 'Predictive Cardiac Analysis' : 'Personal Metabolic Risk Assessment'}
                    </Text>
                </View>

                {/* Mode Switcher */}
                <View style={[styles.modeSwitcher, { backgroundColor: isDark ? '#ffffff10' : '#e2e8f0' }]}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'heart' && styles.modeBtnActive]}
                        onPress={() => { setMode('heart'); setResult(null); }}
                    >
                        <Text style={[styles.modeText, mode === 'heart' && styles.modeTextActive]}>Heart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'diabetes' && styles.modeBtnActive]}
                        onPress={() => { setMode('diabetes'); setResult(null); }}
                    >
                        <Text style={[styles.modeText, mode === 'diabetes' && styles.modeTextActive]}>Diabetes</Text>
                    </TouchableOpacity>
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
                                {result.prediction
                                    ? (mode === 'heart' ? "CARDIAC ANOMALY DETECTED" : "DIABETIC RISK DETECTED")
                                    : "NO SIGNIFICANT ANOMALIES"
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {mode === 'heart' ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Personal Metrics</Text>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Age</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="e.g. 45"
                                    placeholderTextColor="#666"
                                    value={heartData.age}
                                    onChangeText={v => updateHeartForm('age', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Sex</Text>
                                <View style={styles.switchRow}>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, heartData.sex === '1' && styles.segmentActive]}
                                        onPress={() => updateHeartForm('sex', '1')}
                                    >
                                        <Text style={[styles.segmentText, heartData.sex === '1' && styles.segmentTextActive]}>Male</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, heartData.sex === '0' && styles.segmentActive]}
                                        onPress={() => updateHeartForm('sex', '0')}
                                    >
                                        <Text style={[styles.segmentText, heartData.sex === '0' && styles.segmentTextActive]}>Female</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Vital Signs</Text>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Resting BP (mm Hg)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="120"
                                    placeholderTextColor="#666"
                                    value={heartData.trestbps}
                                    onChangeText={v => updateHeartForm('trestbps', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Cholesterol</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="200"
                                    placeholderTextColor="#666"
                                    value={heartData.chol}
                                    onChangeText={v => updateHeartForm('chol', v)}
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
                                    value={heartData.thalach}
                                    onChangeText={v => updateHeartForm('thalach', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Fasting Blood Sugar</Text>
                                <View style={styles.switchRow}>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, heartData.fbs === '1' && styles.segmentActive]}
                                        onPress={() => updateHeartForm('fbs', '1')}
                                    >
                                        <Text style={[styles.segmentText, heartData.fbs === '1' && styles.segmentTextActive]}>{'>'}120</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, heartData.fbs === '0' && styles.segmentActive]}
                                        onPress={() => updateHeartForm('fbs', '0')}
                                    >
                                        <Text style={[styles.segmentText, heartData.fbs === '0' && styles.segmentTextActive]}>{'<'}120</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Health Metrics</Text>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Pregnancies</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    value={diabetesData.pregnancies}
                                    onChangeText={v => updateDiabetesForm('pregnancies', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Blood Sugar</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="140"
                                    placeholderTextColor="#666"
                                    value={diabetesData.glucose}
                                    onChangeText={v => updateDiabetesForm('glucose', v)}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Blood Pressure</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="80"
                                    placeholderTextColor="#666"
                                    value={diabetesData.bp}
                                    onChangeText={v => updateDiabetesForm('bp', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Body Mass (BMI)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="25.5"
                                    placeholderTextColor="#666"
                                    value={diabetesData.bmi}
                                    onChangeText={v => updateDiabetesForm('bmi', v)}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Insulin Level</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    value={diabetesData.insulin}
                                    onChangeText={v => updateDiabetesForm('insulin', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Age</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#ffffff10' : '#fff', color: isDark ? '#fff' : '#000' }]}
                                    keyboardType="numeric"
                                    placeholder="30"
                                    placeholderTextColor="#666"
                                    value={diabetesData.age}
                                    onChangeText={v => updateDiabetesForm('age', v)}
                                />
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={[styles.predictBtn, { opacity: loading ? 0.7 : 1 }]}
                    onPress={predictRisk}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.predictBtnText}>GENERATE HEALTH REPORT</Text>}
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

    modeSwitcher: { flexDirection: 'row', height: 48, borderRadius: 12, padding: 4, marginBottom: 24 },
    modeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    modeBtnActive: { backgroundColor: '#10b981' },
    modeText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
    modeTextActive: { color: '#fff' },

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
    badgeContainer: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    resultText: { fontSize: 13, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 }
});
