import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Appointment, User } from "../../types";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";

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

export default function PatientViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.CONNECTIONS.PATIENT_DATA(id),
      );
      if (data.success) {
        setPatient(data.patient);
        setAppointments(data.appointments.reverse());
      } else {
        Alert.alert("Error", data.message);
        router.back();
      }
    } catch (error: any) {
      Alert.alert(
        "Access Denied",
        error.response?.data?.message || "Could not load patient data",
      );
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Derived data
  const upcomingAppointments = appointments.filter(
    (a) => !a.isCompleted && !a.cancelled,
  );

  const activeMeds = appointments
    .filter((a) => a.isCompleted && a.healthData?.prescribedMedicines?.length)
    .flatMap((a) =>
      a.healthData!.prescribedMedicines.filter((m) => m.remainingQuantity > 0),
    );

  const latestVitals = appointments.find(
    (a) => a.healthData?.heartRate && a.healthData.heartRate !== "",
  )?.healthData;

  const criticalMeds = activeMeds.filter((m) => m.overdoseAlert);

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
      <View className="bg-slate-900 px-6 pt-16 pb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-6"
        >
          <Text className="text-teal-400 text-lg">←</Text>
          <Text className="text-teal-400 font-black text-sm uppercase tracking-widest">
            Back
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 bg-teal-500/20 rounded-2xl items-center justify-center border border-teal-400/30">
            <Text className="text-3xl">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-black">
              {patient?.name}
            </Text>
            <Text className="text-slate-400 text-sm font-medium">
              {patient?.email}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <View className="w-2 h-2 rounded-full bg-teal-400" />
              <Text className="text-teal-400 text-xs font-black uppercase tracking-widest">
                Read Only View
              </Text>
            </View>
          </View>
        </View>

        {/* Critical alert banner */}
        {criticalMeds.length > 0 && (
          <View className="mt-4 bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-2xl">🚨</Text>
            <View className="flex-1">
              <Text className="text-red-400 font-black text-sm uppercase tracking-wider">
                Early Dose Alert
              </Text>
              <Text className="text-red-300 text-xs font-medium mt-0.5">
                {patient?.name?.split(" ")[0]} has logged {criticalMeds.length}{" "}
                early dose{criticalMeds.length > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="px-4 pt-4">
        {/* Read only notice */}
        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
          <Text className="text-xl">👁️</Text>
          <Text className="text-blue-600 text-xs font-bold flex-1 leading-relaxed">
            You are viewing {patient?.name?.split(" ")[0]}'s health data in
            read-only mode. You cannot make changes on their behalf.
          </Text>
        </View>

        {/* Vitals */}
        {latestVitals ? (
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
                    {v.value || "--"}
                    {v.unit}
                  </Text>
                  <Text className="text-slate-400 text-[10px] font-bold uppercase text-center mt-0.5">
                    {v.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-[24px] p-5 mb-4 border border-slate-100 items-center">
            <Text className="text-slate-400 font-medium text-sm">
              No vitals recorded yet
            </Text>
          </View>
        )}

        {/* Upcoming appointments */}
        <View className="mb-4">
          <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
            Upcoming Appointments
          </Text>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((item) => (
              <View
                key={item._id}
                className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center">
                    <Text className="text-2xl">🩺</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">
                      {item.docData?.name}
                    </Text>
                    <Text className="text-teal-500 text-xs font-bold uppercase">
                      {item.docData?.speciality}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border ${
                      item.payment
                        ? "bg-teal-50 border-teal-100"
                        : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black uppercase ${
                        item.payment ? "text-teal-600" : "text-amber-600"
                      }`}
                    >
                      {item.payment ? "Paid" : "Unpaid"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                    <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">
                      Date
                    </Text>
                    <Text className="text-slate-900 font-black text-sm">
                      {slotDateFormat(item.slotDate)}
                    </Text>
                  </View>
                  <View className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                    <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">
                      Time
                    </Text>
                    <Text className="text-slate-900 font-black text-sm">
                      {item.slotTime}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-[24px] p-6 border border-slate-100 items-center">
              <Text className="text-3xl mb-2">📅</Text>
              <Text className="text-slate-400 font-medium text-sm text-center">
                No upcoming appointments
              </Text>
            </View>
          )}
        </View>

        {/* Active medications */}
        <View className="mb-4">
          <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
            Active Medications
          </Text>
          {activeMeds.length > 0 ? (
            activeMeds.map((med, i) => {
              const pct = Math.round(
                ((med.totalQuantity - med.remainingQuantity) /
                  med.totalQuantity) *
                  100,
              );
              return (
                <View
                  key={i}
                  className={`bg-white rounded-[24px] p-5 mb-3 border shadow-sm ${
                    med.overdoseAlert ? "border-red-200" : "border-slate-100"
                  }`}
                >
                  {/* Alert badge */}
                  {med.overdoseAlert && (
                    <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                      <Text className="text-lg">🚨</Text>
                      <Text className="text-red-600 text-xs font-bold">
                        Early dose logged — doctor has been notified
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center gap-3 mb-3">
                    <View
                      className={`w-12 h-12 rounded-2xl items-center justify-center ${
                        med.overdoseAlert ? "bg-red-50" : "bg-teal-50"
                      }`}
                    >
                      <Text className="text-2xl">💊</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">
                        {med.name}
                      </Text>
                      <Text className="text-slate-400 text-xs font-bold uppercase">
                        {med.dosagePerDay}x daily · {med.remainingQuantity}{" "}
                        remaining
                      </Text>
                    </View>
                    <Text className="text-teal-600 font-black text-sm">
                      {pct}%
                    </Text>
                  </View>

                  {/* Adherence bar */}
                  <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${
                        pct > 80
                          ? "bg-teal-500"
                          : pct > 40
                            ? "bg-amber-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </View>

                  {/* Read only notice */}
                  <View className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">
                      Viewing only — only {patient?.name?.split(" ")[0]} can log
                      doses
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white rounded-[24px] p-6 border border-slate-100 items-center">
              <Text className="text-3xl mb-2">💊</Text>
              <Text className="text-slate-400 font-medium text-sm text-center">
                No active medications
              </Text>
            </View>
          )}
        </View>

        {/* Past appointments summary */}
        {appointments.filter((a) => a.isCompleted).length > 0 && (
          <View className="mb-4">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Appointment History
            </Text>
            {appointments
              .filter((a) => a.isCompleted)
              .slice(0, 3)
              .map((item) => (
                <View
                  key={item._id}
                  className="bg-white rounded-[24px] p-4 mb-2 border border-slate-100 flex-row items-center gap-3"
                >
                  <View className="w-10 h-10 bg-teal-50 rounded-xl items-center justify-center">
                    <Text className="text-lg">✅</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-sm">
                      {item.docData?.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-medium">
                      {slotDateFormat(item.slotDate)} · {item.slotTime}
                    </Text>
                  </View>
                  <Text className="text-teal-600 font-black text-xs uppercase">
                    Completed
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
