import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
    const { isLoading, hasOnboarded } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    // User request: Show onboarding EVERY time app opens.
    // Logic: Always redirect to onboarding initially.
    return <Redirect href="/onboarding" />;
}
