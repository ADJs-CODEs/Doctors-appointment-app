import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";

export default function DoctorDashboardScreen() {
  const { doctor, logout, dToken } = useAuth();
  const router = useRouter();
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDash = async () => {
    try {
      const { data } = await axiosInstance.get("/api/doctor/dashboard", {
        headers: { Authorization: `Bearer ${dToken}` },
      });
      if (data.success) setDashData(data.dashData);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDash();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDash();
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const slotDateFormat = (slotDate: string) => {
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const parts = slotDate.split("_");
    return `${parts[0]} ${months[Number(parts[1])]} ${parts[2]}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

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
        <View className="flex-row items-center justify-between mb-4">
          <View className="w-12 h-12 bg-teal-500/20 rounded-full items-center justify-center border border-teal-400/30">
            <Text className="text-teal-400 text-2xl font-black">+</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="px-4 py-2 bg-white/10 rounded-xl border border-white/10"
          >
            <Text className="text-white text-xs font-black uppercase tracking-widest">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-base font-medium">
          Doctor Portal
        </Text>
        <Text className="text-white text-3xl font-black">
          Dr. {doctor?.name?.split(" ").slice(-1)[0]} 🩺
        </Text>
        <Text className="text-teal-400 text-sm font-bold uppercase tracking-wider mt-1">
          {doctor?.speciality}
        </Text>
      </View>

      <View className="px-4 pt-4">
        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          {[
            {
              label: "Earnings",
              value: `$${dashData?.earnings || 0}`,
              emoji: "💰",
              color: "bg-teal-50 border-teal-100",
            },
            {
              label: "Appointments",
              value: dashData?.appointments || 0,
              emoji: "📅",
              color: "bg-blue-50 border-blue-100",
            },
            {
              label: "Patients",
              value: dashData?.patients || 0,
              emoji: "👥",
              color: "bg-purple-50 border-purple-100",
            },
          ].map((s, i) => (
            <View
              key={i}
              className={`flex-1 ${s.color} border rounded-[20px] p-4 items-center`}
            >
              <Text className="text-2xl mb-1">{s.emoji}</Text>
              <Text className="text-slate-900 font-black text-lg">
                {s.value}
              </Text>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider text-center mt-0.5">
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Latest bookings */}
        <View className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mb-6">
          <View className="px-5 py-4 border-b border-slate-50 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-teal-500" />
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">
                Latest Bookings
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(doctor)/appointments")}
            >
              <Text className="text-teal-500 text-[10px] font-black uppercase tracking-widest">
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {dashData?.latestAppointment?.length > 0 ? (
            dashData.latestAppointment.map((item: any, i: number) => {
              const isUrgent =
                item.patientStatus === "Critical" ||
                item.healthData?.prescribedMedicines?.some(
                  (m: any) => m.overdoseAlert,
                );

              return (
                <View
                  key={i}
                  className={`flex-row items-center gap-3 px-5 py-4 border-b border-slate-50 ${isUrgent ? "bg-red-50/50" : ""}`}
                >
                  <View className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center shrink-0">
                    <Text className="text-lg">👤</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text
                      className={`font-black text-sm ${isUrgent ? "text-red-700" : "text-slate-900"}`}
                    >
                      {item.userData?.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-medium">
                      {slotDateFormat(item.slotDate)} · {item.slotTime}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full border ${
                      item.cancelled
                        ? "bg-red-50 border-red-100"
                        : item.isCompleted
                          ? "bg-teal-50 border-teal-100"
                          : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-black uppercase ${
                        item.cancelled
                          ? "text-red-500"
                          : item.isCompleted
                            ? "text-teal-600"
                            : "text-amber-600"
                      }`}
                    >
                      {item.cancelled
                        ? "Cancelled"
                        : item.isCompleted
                          ? "Done"
                          : "Pending"}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-10 items-center">
              <Text className="text-slate-400 font-medium text-sm">
                No bookings yet
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
