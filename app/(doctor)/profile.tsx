import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function DoctorProfileScreen() {
  const { doctor, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-slate-900 px-6 pt-16 pb-10">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">
          Doctor Portal
        </Text>
        <View className="items-center">
          <View className="w-24 h-24 bg-teal-500/20 rounded-full items-center justify-center border-2 border-teal-400/30 mb-4">
            <Text className="text-5xl">🩺</Text>
          </View>
          <Text className="text-white text-2xl font-black">{doctor?.name}</Text>
          <Text className="text-teal-400 text-sm font-bold uppercase tracking-wider mt-1">
            {doctor?.speciality}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-3 bg-teal-500/10 border border-teal-400/20 px-4 py-1.5 rounded-full">
            <View className="w-2 h-2 rounded-full bg-teal-400" />
            <Text className="text-teal-400 text-xs font-black uppercase tracking-widest">
              Verified Doctor
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="bg-white rounded-[24px] p-6 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">
            Professional Information
          </Text>
          {[
            { label: "Full Name", value: doctor?.name, emoji: "👤" },
            { label: "Email", value: doctor?.email, emoji: "📧" },
            { label: "Speciality", value: doctor?.speciality, emoji: "🏥" },
            { label: "Degree", value: doctor?.degree, emoji: "🎓" },
            { label: "Experience", value: doctor?.experience, emoji: "⭐" },
            {
              label: "Consultation Fee",
              value: `$${doctor?.fees}`,
              emoji: "💰",
            },
          ].map((item, i) => (
            <View
              key={i}
              className={`flex-row items-center gap-3 py-3 ${i < 5 ? "border-b border-slate-50" : ""}`}
            >
              <Text className="text-xl w-8">{item.emoji}</Text>
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </Text>
                <Text className="text-slate-900 font-bold text-sm mt-0.5">
                  {item.value || "Not set"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-[24px] p-6 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
            About
          </Text>
          <Text className="text-slate-600 text-sm font-medium leading-relaxed">
            {doctor?.about || "No bio available"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-100 rounded-[20px] py-5 items-center mb-6"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-xl">🚪</Text>
            <Text className="text-red-500 font-black text-sm uppercase tracking-widest">
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
