import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

function RootLayoutNav() {
  const { token, dToken, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inDoctorGroup = segments[0] === "(doctor)";
    const isLoggedIn = token || dToken;

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && (inAuthGroup || inDoctorGroup)) {
      router.replace("/(tabs)");
    } else if (dToken && (inAuthGroup || segments[0] === "(tabs)")) {
      router.replace("/(doctor)");
    }
  }, [token, dToken, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#2dd4bf" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(doctor)" />
      <Stack.Screen name="patient/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
