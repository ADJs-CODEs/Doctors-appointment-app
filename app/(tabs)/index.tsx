import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Appointment } from "../types";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.USER.FETCH_APPOINTMENTS,
      );
      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Get next upcoming appointment
  const nextAppointment = appointments.find(
    (a) => !a.isCompleted && !a.cancelled,
  );

  // Get active medications
  const activeMeds = appointments
    .filter((a) => a.isCompleted && a.healthData?.prescribedMedicines?.length)
    .flatMap((a) =>
      a.healthData!.prescribedMedicines.filter((m) => m.remainingQuantity > 0),
    );

  // Get latest vitals
  const latestVitals = appointments.find(
    (a) => a.healthData?.heartRate && a.healthData.heartRate !== "",
  )?.healthData;

  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

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
        <View className="flex-row items-center justify-between mb-2">
          <View className="w-12 h-12 bg-teal-500/20 rounded-full items-center justify-center border border-teal-400/30">
            <Text className="text-teal-400 text-2xl font-black">+</Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="px-4 py-2 bg-white/10 rounded-xl border border-white/10"
          >
            <Text className="text-white text-xs font-black uppercase tracking-widest">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-base font-medium mt-4">
          {greeting},
        </Text>
        <Text className="text-white text-3xl font-black">{firstName} 👋</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          Here is your health summary for today
        </Text>
      </View>

      <View className="px-4 -mt-5">
        {/* Next Appointment Card */}
        <View className="bg-white rounded-[28px] p-6 mb-4 shadow-sm border border-slate-100">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
            Next Appointment
          </Text>
          {nextAppointment ? (
            <View>
              <Text className="text-slate-900 text-xl font-black">
                {nextAppointment.docData?.name}
              </Text>
              <Text className="text-teal-500 text-sm font-bold uppercase tracking-wider mt-0.5">
                {nextAppointment.docData?.speciality}
              </Text>
              <View className="flex-row items-center gap-4 mt-4">
                <View className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                  <Text className="text-teal-700 font-black text-sm">
                    📅 {nextAppointment.slotDate.replace(/_/g, "/")}
                  </Text>
                </View>
                <View className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                  <Text className="text-teal-700 font-black text-sm">
                    🕐 {nextAppointment.slotTime}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/appointments")}
                className="mt-4 bg-slate-900 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">
                  View Appointment
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center py-4">
              <Text className="text-4xl mb-3">📅</Text>
              <Text className="text-slate-900 font-black text-base">
                No upcoming appointments
              </Text>
              <Text className="text-slate-400 text-sm font-medium mt-1 text-center">
                Book a consultation with a specialist
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/appointments")}
                className="mt-4 bg-teal-500 rounded-xl py-3 px-6 items-center"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">
                  Book Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Vitals Row */}
        {latestVitals && (
          <View className="mb-4">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Latest Vitals
            </Text>
            <View className="flex-row gap-3">
              {[
                {
                  label: "Heart Rate",
                  value: latestVitals.heartRate,
                  unit: "BPM",
                  emoji: "❤️",
                  color: "bg-rose-50 border-rose-100",
                },
                {
                  label: "Blood Pressure",
                  value: latestVitals.bloodPressure,
                  unit: "",
                  emoji: "🩺",
                  color: "bg-blue-50 border-blue-100",
                },
                {
                  label: "Temperature",
                  value: latestVitals.temperature,
                  unit: "°C",
                  emoji: "🌡️",
                  color: "bg-orange-50 border-orange-100",
                },
              ].map((v, i) => (
                <View
                  key={i}
                  className={`flex-1 ${v.color} border rounded-[20px] p-3 items-center`}
                >
                  <Text className="text-2xl mb-1">{v.emoji}</Text>
                  <Text className="text-slate-900 font-black text-sm">
                    {v.value}
                    {v.unit}
                  </Text>
                  <Text className="text-slate-400 text-[10px] font-bold uppercase text-center mt-0.5">
                    {v.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Medications */}
        <View className="bg-white rounded-[28px] p-6 mb-4 shadow-sm border border-slate-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">
              Active Medications
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/medications")}
            >
              <Text className="text-teal-500 text-xs font-black uppercase tracking-widest">
                See All →
              </Text>
            </TouchableOpacity>
          </View>

          {activeMeds.length > 0 ? (
            activeMeds.slice(0, 3).map((med, i) => {
              const pct = Math.round(
                ((med.totalQuantity - med.remainingQuantity) /
                  med.totalQuantity) *
                  100,
              );
              return (
                <View key={i} className="mb-4 last:mb-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xl">💊</Text>
                      <View>
                        <Text className="text-slate-900 font-black text-sm">
                          {med.name}
                        </Text>
                        <Text className="text-slate-400 text-xs font-bold uppercase">
                          {med.dosagePerDay}x daily · {med.remainingQuantity}{" "}
                          left
                        </Text>
                      </View>
                    </View>
                    <Text className="text-teal-600 font-black text-sm">
                      {pct}%
                    </Text>
                  </View>
                  <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center py-4">
              <Text className="text-3xl mb-2">💊</Text>
              <Text className="text-slate-400 font-medium text-sm text-center">
                No active medications
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-4">
          <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            {[
              {
                emoji: "👁️",
                label: "Watch\nOver Someone",
                color: "bg-purple-50 border-purple-100",
                route: "/(tabs)/watching",
              },
              {
                emoji: "📋",
                label: "My\nAppointments",
                color: "bg-teal-50 border-teal-100",
                route: "/(tabs)/appointments",
              },
              {
                emoji: "💊",
                label: "My\nMedications",
                color: "bg-blue-50 border-blue-100",
                route: "/(tabs)/medications",
              },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push(action.route as any)}
                className={`flex-1 ${action.color} border rounded-[20px] p-4 items-center`}
                activeOpacity={0.7}
              >
                <Text className="text-3xl mb-2">{action.emoji}</Text>
                <Text className="text-slate-700 font-black text-xs uppercase tracking-tight text-center">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom padding */}
        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
