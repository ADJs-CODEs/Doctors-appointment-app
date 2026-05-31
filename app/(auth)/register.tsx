import { Link, useRouter } from "expo-router";
import { useState } from "react";
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

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Details", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (data.success) {
        await login(data.token);
      } else {
        Alert.alert("Registration Failed", data.message);
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
        <View className="items-center pt-16 pb-8 px-6">
          <View className="w-20 h-20 bg-teal-500/20 rounded-full items-center justify-center mb-4 border-2 border-teal-400/30">
            <Text className="text-teal-400 text-4xl font-black">+</Text>
          </View>
          <Text className="text-white text-3xl font-black uppercase tracking-tight">
            ADJ's CODEs
          </Text>
          <Text className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            Create Your Account
          </Text>
        </View>

        {/* Card */}
        <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-10 pb-8">
          <Text className="text-slate-900 text-3xl font-black mb-2">
            Join The Network
          </Text>
          <Text className="text-slate-400 text-base font-medium mb-10">
            Your health profile, secured and private
          </Text>

          {/* Full Name */}
          <View className="mb-5">
            <Text className="text-slate-500 text-sm font-black uppercase tracking-widest mb-2 ml-1">
              Full Name
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-lg font-medium"
              placeholder="Your full name"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
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
                placeholder="Min. 8 characters"
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

            {/* Password strength */}
            {password.length > 0 && (
              <View className="flex-row gap-1 mt-2">
                {[1, 2, 3, 4].map((n) => (
                  <View
                    key={n}
                    className={`flex-1 h-1 rounded-full ${
                      password.length >= n * 3
                        ? n <= 2
                          ? "bg-red-400"
                          : n === 3
                            ? "bg-amber-400"
                            : "bg-teal-500"
                        : "bg-slate-100"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-slate-900 rounded-2xl py-5 items-center mb-6"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#2dd4bf" />
            ) : (
              <Text className="text-white font-black text-base uppercase tracking-widest">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-slate-400 text-base font-medium">
              Already registered?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-teal-600 font-black text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Terms */}
          <Text className="text-slate-300 text-xs text-center mt-6 leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy
            Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
