'use client';

import Header from '@/components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@package/store/auth-native';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthLayout() {
  const { accessToken, isAuthenticated, isHydrated, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isHydrated || isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-[#020617] items-center justify-center">
        <MaterialCommunityIcons name="orbit" size={48} color="#4318FF" />
        <ActivityIndicator size="small" color="#4318FF" className="mt-4" />
      </View>
    );
  }

  if (isAuthenticated || accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top > 0 ? insets.top : 20 }}
      className="bg-white dark:bg-[#020617]"
    >
      <Header />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="verify-2fa" />
        </Stack>
      </View>
    </View>
  );
}
