import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";

export default function LoginScreen() {
  const { login, doctorLogin } = useAuth();

  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Details", "Please enter your email and password");
      return;
    }

    try {
      setLoading(true);

      if (role === "patient") {
        const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
          email: email.toLowerCase().trim(),
          password,
        });
        if (data.success) {
          await login(data.token);
        } else {
          Alert.alert("Login Failed", data.message);
        }
      } else {
        const { data } = await axiosInstance.post(API_PATHS.AUTH.DOCTOR_LOGIN, {
          email: email.toLowerCase().trim(),
          password,
        });
        if (data.success) {
          await doctorLogin(data.token);
        } else {
          Alert.alert("Login Failed", data.message);
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center pt-20 pb-10 px-6">
          <View className="w-20 h-20 bg-teal-500/20 rounded-full items-center justify-center mb-4 border-2 border-teal-400/30">
            <Text className="text-teal-400 text-4xl font-black">+</Text>
          </View>
          <Text className="text-white text-3xl font-black uppercase tracking-tight">
            ADJs CODEs
          </Text>
          <Text className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            Pharmaceutical
          </Text>
        </View>

        {/* Card */}
        <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-10 pb-8">
          <Text className="text-slate-900 text-3xl font-black mb-2">
            Welcome Back
          </Text>
          <Text className="text-slate-400 text-base font-medium mb-8">
            Sign in to your account
          </Text>

          {/* Role selector */}
          <View className="flex-row bg-slate-100 rounded-2xl p-1 mb-8">
            {(["patient", "doctor"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  role === r ? "bg-slate-900" : ""
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-black text-sm uppercase tracking-widest ${
                    role === r ? "text-white" : "text-slate-400"
                  }`}
                >
                  {r === "patient" ? "🏥 Patient" : "🩺 Doctor"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <View className="mb-5">
            <Text className="text-slate-500 text-sm font-black uppercase tracking-widest mb-2 ml-1">
              Email Address
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-lg font-medium"
              placeholder="your@email.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View className="mb-8">
            <Text className="text-slate-500 text-sm font-black uppercase tracking-widest mb-2 ml-1">
              Password
            </Text>
            <View className="relative">
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-lg font-medium pr-16"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-4"
              >
                <Text className="text-teal-500 font-black text-sm">
                  {showPassword ? "HIDE" : "SHOW"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-slate-900 rounded-2xl py-5 items-center mb-5"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#2dd4bf" />
            ) : (
              <Text className="text-white font-black text-base uppercase tracking-widest">
                Sign In as {role === "patient" ? "Patient" : "Doctor"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link — patients only */}
          {role === "patient" && (
            <View className="flex-row justify-center items-center mb-6">
              <Text className="text-slate-400 text-base font-medium">
                New patient?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-teal-600 font-black text-base">
                    Create Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* Elderly helper */}
          <View className="mt-4 bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <Text className="text-teal-700 text-sm font-black mb-1">
              Need help signing in?
            </Text>
            <Text className="text-teal-600 text-sm font-medium">
              Call us on (+234) 704 203 0981 and we will assist you.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
