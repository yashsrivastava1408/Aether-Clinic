import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { GlitchText } from '@/components/ui/GlitchText';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid neural address.');
            return;
        }

        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            await login(email);
            setLoading(false);
            Alert.alert('Magic Link Sent', 'Check your inbox to secure your account.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, padding: 24, justifyContent: 'center' }}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <GlitchText text="WELCOME BACK" style={styles.title} color="#10b981" />
                    <Text style={styles.subtitle}>Enter your email to sign in or create an account.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" />
                        <TextInput
                            style={styles.input}
                            placeholder="user@email.com"
                            placeholderTextColor="#444"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>CONTINUE WITH EMAIL</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    By continuing, you agree to our Terms and Privacy Policy.
                </Text>

            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backButton: {
        position: 'absolute', top: 60, left: 24, zIndex: 10
    },
    header: { marginBottom: 40 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
    subtitle: { color: '#888', fontSize: 14 },

    form: { gap: 16 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: '#333',
        borderRadius: 12,
        padding: 16,
    },
    input: { flex: 1, color: '#fff', fontSize: 16 },

    button: {
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 },

    footer: {
        position: 'absolute', bottom: 40, left: 24, right: 24,
        textAlign: 'center', color: '#444', fontSize: 10,
    }
});
