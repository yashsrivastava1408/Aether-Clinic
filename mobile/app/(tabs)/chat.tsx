import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import { Config } from '@/constants/Config';
import { SpecialistCarousel } from '@/components/SpecialistCarousel';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

const API_URL = Config.API_URL;

export default function ChatScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const tabBarHeight = useBottomTabBarHeight();
    const { user } = useAuth();

    const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Reset chat when specialist changes (optional, but good for clean slate)
    useEffect(() => {
        if (selectedSpecialist) {
            setMessages([
                {
                    id: '1',
                    sender: 'ai',
                    text: `Connected to ${selectedSpecialist.name} Module.\n${selectedSpecialist.role} active. How can I assist?`
                }
            ]);
        }
    }, [selectedSpecialist]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("message", userMsg.text);
            formData.append("userId", user?.id || "guest-fallback");
            formData.append("specialization", selectedSpecialist?.name || "General");

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

    const handleBackToCarousel = () => {
        setSelectedSpecialist(null);
        setMessages([]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030303' : '#f8fafc' }]}>

            {!selectedSpecialist ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
                    <SpecialistCarousel onSelect={setSelectedSpecialist} />
                </Animated.View>
            ) : (
                <Animated.View entering={FadeIn} style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: isDark ? '#ffffff1a' : '#e2e8f0' }]}>
                        <TouchableOpacity onPress={handleBackToCarousel} style={{ marginRight: 12 }}>
                            <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#0f172a'} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedSpecialist.name}</Text>
                            <Text style={{ color: selectedSpecialist.color, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>
                                {selectedSpecialist.role.toUpperCase()}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { marginLeft: 'auto', backgroundColor: selectedSpecialist.color + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: selectedSpecialist.color }]} />
                            <Text style={[styles.statusText, { color: selectedSpecialist.color }]}>ONLINE</Text>
                        </View>
                    </View>

                    {/* Emergency Warning */}
                    <View style={{ backgroundColor: '#7f1d1d20', padding: 8, alignItems: 'center' }}>
                        <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: 'bold' }}>
                            NOT FOR EMERGENCIES. CONTACT URGENT CARE FOR SEVERE SYMPTOMS.
                        </Text>
                    </View>

                    {/* Chat List */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListFooterComponent={
                            <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 10, marginTop: 20, paddingHorizontal: 20 }}>
                                AI-generated insights for {selectedSpecialist.name}. Not medical advice.
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <View style={[
                                styles.messageBubble,
                                item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                                {
                                    backgroundColor: item.sender === 'user'
                                        ? selectedSpecialist.color
                                        : (isDark ? '#ffffff10' : '#ffffff'),
                                    borderColor: isDark ? '#ffffff20' : '#e2e8f0',
                                    borderWidth: item.sender === 'user' ? 0 : 1
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
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    >
                        <View style={{
                            backgroundColor: isDark ? '#0a0a0a' : '#fff',
                            borderTopColor: isDark ? '#ffffff1a' : '#e2e8f0',
                            borderTopWidth: 1,
                            paddingBottom: tabBarHeight
                        }}>
                            <View style={[styles.inputContainer, { borderTopWidth: 0, paddingBottom: 12 }]}>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: isDark ? '#ffffff10' : '#f1f5f9',
                                        color: isDark ? '#fff' : '#0f172a'
                                    }]}
                                    placeholder={`Ask ${selectedSpecialist.name}...`}
                                    placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
                                    value={input}
                                    onChangeText={setInput}
                                />
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: selectedSpecialist.color, opacity: !input.trim() ? 0.5 : 1 }]}
                                    onPress={sendMessage}
                                    disabled={!input.trim() || loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 40,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '80%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
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

