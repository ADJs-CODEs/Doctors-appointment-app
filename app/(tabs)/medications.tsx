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
import type { Appointment, Medicine } from "../../types";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";

interface MedWithContext extends Medicine {
  appointmentId: string;
  doctorName: string;
  isEarly: boolean;
  hoursLeft: number;
}

const getNextDoseTime = (
  med: Medicine,
): { isEarly: boolean; hoursLeft: number } => {
  if (!med.lastTaken || !med.dosagePerDay)
    return { isEarly: false, hoursLeft: 0 };
  const intervalHours = 24 / med.dosagePerDay;
  const lastTakenTime = new Date(med.lastTaken).getTime();
  const nextDoseTime = lastTakenTime + intervalHours * 60 * 60 * 1000;
  const now = Date.now();
  const diff = nextDoseTime - now;
  const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
  return {
    isEarly: diff > 0,
    hoursLeft: Math.max(0, hoursLeft),
  };
};

export default function MedicationsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingDose, setLoggingDose] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.USER.FETCH_APPOINTMENTS,
      );
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error("Failed to fetch medications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const logDose = async (
    appointmentId: string,
    medicineName: string,
    isEarly: boolean,
  ) => {
    if (isEarly) {
      Alert.alert(
        "⚠️ Early Dose Warning",
        `It is too early to take ${medicineName}. Logging this dose will alert your doctor. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Anyway",
            style: "destructive",
            onPress: () => submitDose(appointmentId, medicineName, true),
          },
        ],
      );
    } else {
      await submitDose(appointmentId, medicineName, false);
    }
  };

  const submitDose = async (
    appointmentId: string,
    medicineName: string,
    overdoseAlert: boolean,
  ) => {
    try {
      setLoggingDose(`${appointmentId}-${medicineName}`);
      const { data } = await axiosInstance.post(API_PATHS.USER.LOG_DOSE, {
        appointmentId,
        medicineName,
        overdoseAlert,
      });
      if (data.success) {
        Alert.alert(
          "✅ Dose Logged",
          `${medicineName} has been recorded successfully.`,
        );
        fetchData();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to log dose",
      );
    } finally {
      setLoggingDose(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Build flat list of all active meds with context
  const activeMeds: MedWithContext[] = appointments
    .filter((a) => a.isCompleted && a.healthData?.prescribedMedicines?.length)
    .flatMap((a) =>
      a
        .healthData!.prescribedMedicines.filter((m) => m.remainingQuantity > 0)
        .map((m) => {
          const { isEarly, hoursLeft } = getNextDoseTime(m);
          return {
            ...m,
            appointmentId: a._id,
            doctorName: a.docData?.name || "Doctor",
            isEarly,
            hoursLeft,
          };
        }),
    );

  const completedMeds: MedWithContext[] = appointments
    .filter((a) => a.isCompleted && a.healthData?.prescribedMedicines?.length)
    .flatMap((a) =>
      a
        .healthData!.prescribedMedicines.filter((m) => m.remainingQuantity <= 0)
        .map((m) => ({
          ...m,
          appointmentId: a._id,
          doctorName: a.docData?.name || "Doctor",
          isEarly: false,
          hoursLeft: 0,
        })),
    );

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
        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
          ADJ's CODEs
        </Text>
        <Text className="text-white text-3xl font-black">My Medications</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          {activeMeds.length} active · {completedMeds.length} completed
        </Text>
      </View>

      <View className="px-4 pt-4">
        {/* Active Medications */}
        {activeMeds.length > 0 ? (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Active Medications
            </Text>

            {activeMeds.map((med, i) => {
              const pct = Math.round(
                ((med.totalQuantity - med.remainingQuantity) /
                  med.totalQuantity) *
                  100,
              );
              const isProcessing =
                loggingDose === `${med.appointmentId}-${med.name}`;

              return (
                <View
                  key={i}
                  className={`bg-white rounded-[24px] p-5 mb-3 border shadow-sm ${
                    med.isEarly ? "border-red-200" : "border-slate-100"
                  }`}
                >
                  {/* Med header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className={`w-12 h-12 rounded-2xl items-center justify-center ${
                          med.isEarly ? "bg-red-50" : "bg-teal-50"
                        }`}
                      >
                        <Text className="text-2xl">💊</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-base">
                          {med.name}
                        </Text>
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                          {med.dosagePerDay}x daily · Prescribed by{" "}
                          {med.doctorName}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`px-2 py-1 rounded-lg ${
                        med.isEarly ? "bg-red-50" : "bg-teal-50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase ${
                          med.isEarly ? "text-red-500" : "text-teal-600"
                        }`}
                      >
                        {med.remainingQuantity} left
                      </Text>
                    </View>
                  </View>

                  {/* Early dose warning */}
                  {med.isEarly && (
                    <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                      <Text className="text-lg">⚠️</Text>
                      <Text className="text-red-600 text-xs font-bold flex-1">
                        Next dose in {med.hoursLeft}h — taking early will alert
                        your doctor
                      </Text>
                    </View>
                  )}

                  {/* Safe to take */}
                  {!med.isEarly && med.lastTaken && (
                    <View className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                      <Text className="text-lg">✅</Text>
                      <Text className="text-teal-700 text-xs font-bold">
                        Safe to take now
                      </Text>
                    </View>
                  )}

                  {/* Adherence bar */}
                  <View className="mb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase">
                        Adherence
                      </Text>
                      <Text className="text-teal-600 font-black text-[10px]">
                        {pct}%
                      </Text>
                    </View>
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
                  </View>

                  {/* Log dose button */}
                  <TouchableOpacity
                    onPress={() =>
                      logDose(med.appointmentId, med.name, med.isEarly)
                    }
                    disabled={isProcessing}
                    className={`rounded-xl py-4 items-center ${
                      med.isEarly ? "bg-red-500" : "bg-slate-900"
                    }`}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-black text-sm uppercase tracking-widest">
                        {med.isEarly
                          ? "⚠️ Log Early Dose"
                          : "✓ Confirm Dose Taken"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-white rounded-[24px] p-8 mb-6 items-center border border-slate-100">
            <Text className="text-5xl mb-4">💊</Text>
            <Text className="text-slate-900 font-black text-lg mb-2">
              No active medications
            </Text>
            <Text className="text-slate-400 text-sm font-medium text-center">
              Your prescribed medications will appear here after a completed
              appointment
            </Text>
          </View>
        )}

        {/* Completed Medications */}
        {completedMeds.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Completed Courses
            </Text>
            {completedMeds.map((med, i) => (
              <View
                key={i}
                className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 opacity-60"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center">
                    <Text className="text-2xl">✅</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">
                      {med.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Course completed · {med.totalQuantity} doses taken
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
