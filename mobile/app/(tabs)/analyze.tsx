import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Using the same reliable IP address we fixed earlier
const API_URL = 'http://192.168.1.6:5050';

export default function AnalyzeScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async (useCamera: boolean) => {
        try {
            let result;
            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert("Permission needed", "Camera access is required to take photos.");
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
            }

            if (!result.canceled) {
                setImage(result.assets[0].uri);
                setResult(null); // Reset previous results
            }
        } catch (error) {
            Alert.alert("Error", "Failed to select image.");
        }
    };

    const analyzeReport = async () => {
        if (!image) return;

        setLoading(true);
        try {
            const formData = new FormData();

            // Append image correctly for React Native
            const filename = image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;

            // @ts-ignore
            formData.append('report', { uri: image, name: filename, type });
            formData.append('userId', 'mobile-user-01'); // Demo ID

            const res = await axios.post(`${API_URL}/api/report/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(res.data);
        } catch (error: any) {
            console.error("Analyze Error:", error);
            Alert.alert("Analysis Failed", "Could not process the image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030303' : '#f8fafc' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Report Analyzer</Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Scan medical documents for AI insights
                    </Text>
                </View>

                {/* Image Display / Selection */}
                <View style={[styles.card, { backgroundColor: isDark ? '#ffffff0a' : '#fff' }]}>
                    {image ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => { setImage(null); setResult(null); }}
                            >
                                <Text style={styles.removeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <IconSymbol name="doc.text.viewfinder" size={48} color={isDark ? '#4b5563' : '#cbd5e1'} />
                            <Text style={[styles.placeholderText, { color: isDark ? '#6b7280' : '#94a3b8' }]}>
                                No Report Selected
                            </Text>
                        </View>
                    )}

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: isDark ? '#ffffff15' : '#e2e8f0' }]}
                            onPress={() => pickImage(false)}
                        >
                            <IconSymbol name="photo.fill" size={20} color={isDark ? '#fff' : '#334155'} />
                            <Text style={[styles.actionBtnText, { color: isDark ? '#fff' : '#334155' }]}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: isDark ? '#ffffff15' : '#e2e8f0' }]}
                            onPress={() => pickImage(true)}
                        >
                            <IconSymbol name="camera.fill" size={20} color={isDark ? '#fff' : '#334155'} />
                            <Text style={[styles.actionBtnText, { color: isDark ? '#fff' : '#334155' }]}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Analyze Button */}
                {image && !result && (
                    <TouchableOpacity
                        style={[styles.analyzeButton, { opacity: loading ? 0.7 : 1 }]}
                        onPress={analyzeReport}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeButtonText}>ANALYZE REPORT</Text>}
                    </TouchableOpacity>
                )}

                {/* Results Section */}
                {result && (
                    <View style={[styles.resultContainer, { backgroundColor: isDark ? '#ffffff0a' : '#fff' }]}>
                        <View style={[
                            styles.resultHeader,
                            { borderBottomColor: isDark ? '#ffffff1a' : '#e2e8f0' }
                        ]}>
                            <Text style={[styles.resultTitle, { color: '#10b981' }]}>Analysis Complete</Text>
                        </View>

                        {/* Summary */}
                        <View style={styles.resultSection}>
                            <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>SUMMARY</Text>
                            <Text style={[styles.sectionBody, { color: isDark ? '#fff' : '#1e293b' }]}>
                                {result.summary}
                            </Text>
                        </View>

                        {/* Risk Assessment */}
                        {result.risk_assessment && (
                            <View style={styles.resultSection}>
                                <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>RISK ASSESSMENT</Text>
                                {/* Usually this is a markdown string or object, adjusting based on backend response shape */}
                                {/* Assuming result.risk_assessment is a string for simplicity, or we check existing shape */}
                                <Text style={[styles.sectionBody, { color: isDark ? '#fff' : '#1e293b' }]}>
                                    {typeof result.risk_assessment === 'string' ? result.risk_assessment : JSON.stringify(result.risk_assessment)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 24 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    headerSubtitle: { fontSize: 16, marginTop: 4 },

    card: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    uploadPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
    placeholderText: { fontSize: 16, fontWeight: '500' },

    imagePreviewContainer: { position: 'relative', height: 300, backgroundColor: '#000' },
    previewImage: { width: '100%', height: '100%' },
    removeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    removeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    actionButtons: { flexDirection: 'row', gap: 12, padding: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
    actionBtnText: { fontWeight: '600', fontSize: 15 },

    analyzeButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 24, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    analyzeButtonText: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 16 },

    resultContainer: { borderRadius: 16, padding: 20 },
    resultHeader: { paddingBottom: 16, borderBottomWidth: 1, marginBottom: 16 },
    resultTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
    resultSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    sectionBody: { fontSize: 15, lineHeight: 24 },
});
