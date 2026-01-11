import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DoctorCardProps {
    name: string;
    specialty: string;
    rating: number;
    reviews: number;
    image?: string; // URL or local asset logic
    onPress: () => void;
}

export const DoctorCard = ({ name, specialty, rating, reviews, onPress }: DoctorCardProps) => {
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                style={styles.gradient}
            >
                <View style={styles.row}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#a1a1aa" />
                    </View>

                    <View style={styles.info}>
                        <View style={styles.header}>
                            <Text style={styles.name}>{name}</Text>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#fbbf24" />
                                <Text style={styles.ratingText}>{rating}</Text>
                            </View>
                        </View>
                        <Text style={styles.specialty}>{specialty}</Text>
                        <Text style={styles.reviews}>{reviews} verified consultations</Text>
                    </View>

                    <View style={styles.action}>
                        <Ionicons name="chevron-forward" size={20} color="#525252" />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    gradient: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    info: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '700',
    },
    specialty: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
        marginBottom: 4,
    },
    reviews: {
        fontSize: 12,
        color: '#737373',
    },
    action: {
        marginLeft: 12,
    },
});
