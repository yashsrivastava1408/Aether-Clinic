import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

// Replace with your MACHINE IP if testing on device, or 'localhost' for Simulator
// iOS Simulator: localhost is fine.
// Android Emulator: 10.0.2.2 usually.
// Real Device: Your LAN IP (e.g., 192.168.1.5)
const API_URL = 'http://192.168.1.6:5050';

export default function ChatScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', sender: 'ai', text: 'Neural Interface Active. \nHow can I help you today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // API CALL
            // We are hitting the same backend we built for the web!
            // Using a hardcoded userId for mobile demo for now.
            const formData = new FormData();
            formData.append("message", userMsg.text);
            formData.append("userId", "mobile-user-01");
            formData.append("specialization", "General");

            // Note: React Native FormData is tricky with images, but for text it's straightforward.
            // If direct formData fails in RN without a file, we might need to adjust backend or use JSON.
            // Let's try FormData first as backend matches it.

            const res = await axios.post(`${API_URL}/api/chat`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.reply) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'ai',
                    text: res.data.reply
                }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'ai',
                text: 'Connection Error: Unable to reach Neural Core.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030303' : '#f8fafc' }]}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#ffffff1a' : '#e2e8f0' }]}>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Dr. AI</Text>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ONLINE</Text>
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageBubble,
                        item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                        {
                            backgroundColor: item.sender === 'user'
                                ? '#2563eb'
                                : (isDark ? '#ffffff10' : '#ffffff'),
                            borderColor: isDark ? '#ffffff20' : '#e2e8f0'
                        }
                    ]}>
                        <Text style={[
                            styles.messageText,
                            { color: item.sender === 'user' ? '#fff' : (isDark ? '#e2e8f0' : '#1e293b') }
                        ]}>
                            {item.text}
                        </Text>
                    </View>
                )}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, {
                    backgroundColor: isDark ? '#0a0a0a' : '#fff',
                    borderTopColor: isDark ? '#ffffff1a' : '#e2e8f0'
                }]}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#ffffff10' : '#f1f5f9',
                            color: isDark ? '#fff' : '#0f172a'
                        }]}
                        placeholder="Describe your symptoms..."
                        placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { opacity: !input.trim() ? 0.5 : 1 }]}
                        onPress={sendMessage}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.sendButtonText}>→</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b98120',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    statusText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '80%',
        borderWidth: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
        borderWidth: 0,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    inputContainer: {
        padding: 12,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
});
