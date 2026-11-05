import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Appearance, View } from "react-native";
import { colors } from "../components/native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

// always light: native headers, tab bar, sheets and the keyboard too, even on a phone set to dark
Appearance.setColorScheme("light");

function RootLayoutNav() {
  const { token, dToken, loading: authLoading } = useAuth();
  // the website's fonts. If they fail, or take more than 4 seconds, the app carries on with the
  // phone's own font rather than waiting
  const [fontsLoaded, fontError] = useFonts({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, IBMPlexMono_500Medium });
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), 4000);
    return () => clearTimeout(t);
  }, []);
  const loading = authLoading || (!fontsLoaded && !fontError && !gaveUp);
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(doctor)" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="doctors" />
      <Stack.Screen name="watching" />
      <Stack.Screen name="pharmacy" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
