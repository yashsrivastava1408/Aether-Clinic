import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (text: string) => void;
}

export const SearchBar = ({ placeholder = "QUERY DATABASE...", onSearch }: SearchBarProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="search" size={20} color="#10b981" />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                selectionColor="#10b981"
            />
            <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: 'System', // Replace with custom font if available
        letterSpacing: 0.5,
    },
    filterBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginLeft: 8,
    },
});
