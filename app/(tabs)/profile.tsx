import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  const menuItems = [
    {
      emoji: "👁️",
      label: "Watching Over",
      subtitle: "Manage your care connections",
      color: "bg-purple-50 border-purple-100",
      onPress: () => router.push("/(tabs)/watching"),
    },
    {
      emoji: "📅",
      label: "My Appointments",
      subtitle: "View and manage bookings",
      color: "bg-teal-50 border-teal-100",
      onPress: () => router.push("/(tabs)/appointments"),
    },
    {
      emoji: "💊",
      label: "My Medications",
      subtitle: "Track your prescriptions",
      color: "bg-blue-50 border-blue-100",
      onPress: () => router.push("/(tabs)/medications"),
    },
    {
      emoji: "🔒",
      label: "Privacy & Security",
      subtitle: "Password and account settings",
      color: "bg-slate-50 border-slate-100",
      onPress: () => Alert.alert("Coming Soon", "This feature is coming soon"),
    },
    {
      emoji: "📞",
      label: "Contact Support",
      subtitle: "(+234) 704 203 0981",
      color: "bg-green-50 border-green-100",
      onPress: () => Alert.alert("Support", "Call us on (+234) 704 203 0981"),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#14b8a6"
        />
      }
    >
      {/* Header */}
      <View className="bg-slate-900 px-6 pt-16 pb-10">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">
          ADJ's CODEs
        </Text>

        {/* Avatar */}
        <View className="items-center">
          <View className="w-24 h-24 bg-teal-500/20 rounded-full items-center justify-center border-2 border-teal-400/30 mb-4">
            <Text className="text-5xl">👤</Text>
          </View>
          <Text className="text-white text-2xl font-black">{user?.name}</Text>
          <Text className="text-slate-400 text-sm font-medium mt-1">
            {user?.email}
          </Text>

          {/* Verified badge */}
          <View className="flex-row items-center gap-1.5 mt-3 bg-teal-500/10 border border-teal-400/20 px-4 py-1.5 rounded-full">
            <View className="w-2 h-2 rounded-full bg-teal-400" />
            <Text className="text-teal-400 text-xs font-black uppercase tracking-widest">
              Verified Patient
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        {/* Personal info card */}
        <View className="bg-white rounded-[24px] p-6 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">
            Personal Information
          </Text>

          {[
            { label: "Full Name", value: user?.name, emoji: "👤" },
            { label: "Email", value: user?.email, emoji: "📧" },
            { label: "Phone", value: user?.phone || "Not set", emoji: "📞" },
            {
              label: "Date of Birth",
              value: user?.dob || "Not set",
              emoji: "🎂",
            },
            { label: "Gender", value: user?.gender || "Not set", emoji: "⚧" },
          ].map((item, i) => (
            <View
              key={i}
              className={`flex-row items-center gap-3 py-3 ${
                i < 4 ? "border-b border-slate-50" : ""
              }`}
            >
              <Text className="text-xl w-8">{item.emoji}</Text>
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </Text>
                <Text className="text-slate-900 font-bold text-sm mt-0.5">
                  {item.value}
                </Text>
              </View>
            </View>
          ))}

          {/* Address */}
          {user?.address?.line1 && (
            <View className="flex-row items-start gap-3 pt-3">
              <Text className="text-xl w-8">📍</Text>
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Address
                </Text>
                <Text className="text-slate-900 font-bold text-sm mt-0.5">
                  {user.address.line1}
                </Text>
                {user.address.line2 && (
                  <Text className="text-slate-600 font-medium text-sm">
                    {user.address.line2}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Menu items */}
        <View className="mb-4">
          <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
            Quick Access
          </Text>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.onPress}
              className="bg-white rounded-[20px] p-4 mb-2 border border-slate-100 shadow-sm flex-row items-center gap-4"
              activeOpacity={0.7}
            >
              <View
                className={`w-12 h-12 ${item.color} border rounded-2xl items-center justify-center`}
              >
                <Text className="text-2xl">{item.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-black text-sm">
                  {item.label}
                </Text>
                <Text className="text-slate-400 text-xs font-medium mt-0.5">
                  {item.subtitle}
                </Text>
              </View>
              <Text className="text-slate-300 text-lg">→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View className="bg-slate-900 rounded-[24px] p-6 mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 bg-teal-500/20 rounded-full items-center justify-center border border-teal-400/30">
              <Text className="text-teal-400 text-xl font-black">+</Text>
            </View>
            <View>
              <Text className="text-white font-black text-base">
                ADJ's CODEs
              </Text>
              <Text className="text-slate-400 text-xs font-medium">
                Pharmaceutical
              </Text>
            </View>
          </View>
          <Text className="text-slate-400 text-xs font-medium leading-relaxed">
            Your complete digital health companion. Book appointments, track
            medications, monitor vitals and watch over your loved ones.
          </Text>
          <Text className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-3">
            Version 1.0.0
          </Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-red-50 border border-red-100 rounded-[20px] py-5 items-center mb-6"
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">🚪</Text>
              <Text className="text-red-500 font-black text-sm uppercase tracking-widest">
                Sign Out
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
