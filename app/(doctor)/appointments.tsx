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

export default function DoctorAppointmentsScreen() {
  const { dToken } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchAppointments = async () => {
    try {
      const { data } = await axiosInstance.get("/api/doctor/appointments", {
        headers: { Authorization: `Bearer ${dToken}` },
      });
      if (data.success) {
        const sorted = [...data.appointments].sort((a, b) => {
          const aCritical =
            a.patientStatus === "Critical" ||
            a.healthData?.prescribedMedicines?.some(
              (m: any) => m.overdoseAlert,
            );
          const bCritical =
            b.patientStatus === "Critical" ||
            b.healthData?.prescribedMedicines?.some(
              (m: any) => m.overdoseAlert,
            );
          if (aCritical && !bCritical) return -1;
          if (!aCritical && bCritical) return 1;
          const aActive = !a.isCompleted && !a.cancelled;
          const bActive = !b.isCompleted && !b.cancelled;
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          return b.date - a.date;
        });
        setAppointments(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await axiosInstance.post(
              "/api/doctor/cancel-appointment",
              { appointmentId },
              { headers: { Authorization: `Bearer ${dToken}` } },
            );
            if (data.success) fetchAppointments();
          } catch (error) {
            Alert.alert("Error", "Failed to cancel");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
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
      <View className="bg-slate-900 px-6 pt-16 pb-8">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
          Doctor Portal
        </Text>
        <Text className="text-white text-3xl font-black">Patient Schedule</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          {appointments.filter((a) => !a.isCompleted && !a.cancelled).length}{" "}
          active · Critical first
        </Text>
      </View>

      <View className="px-4 pt-4">
        {appointments.map((item, index) => {
          const isCritical =
            item.patientStatus === "Critical" ||
            item.healthData?.prescribedMedicines?.some(
              (m: any) => m.overdoseAlert,
            );

          return (
            <View
              key={item._id || index}
              className={`bg-white rounded-[24px] p-5 mb-3 border shadow-sm ${
                isCritical ? "border-red-200" : "border-slate-100"
              }`}
            >
              {isCritical && (
                <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                  <Text className="text-lg">🚨</Text>
                  <Text className="text-red-600 text-xs font-bold">
                    Critical patient — early dose or overdose flagged
                  </Text>
                </View>
              )}

              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${isCritical ? "bg-red-50" : "bg-slate-50"}`}
                >
                  <Text className="text-2xl">👤</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-black text-base ${isCritical ? "text-red-700" : "text-slate-900"}`}
                  >
                    {item.userData?.name}
                  </Text>
                  <Text className="text-slate-400 text-xs font-medium">
                    {slotDateFormat(item.slotDate)} · {item.slotTime}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full border ${
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
                    {item.payment ? "Paid" : "Cash"}
                  </Text>
                </View>
              </View>

              {/* Fee */}
              <View className="flex-row justify-between mb-3 pt-3 border-t border-slate-50">
                <Text className="text-slate-400 text-sm font-medium">Fee</Text>
                <Text className="text-slate-900 font-black text-sm">
                  ${item.amount}
                </Text>
              </View>

              {/* Status badge */}
              <View
                className={`py-2 rounded-xl items-center border ${
                  item.cancelled
                    ? "bg-red-50 border-red-100"
                    : item.isCompleted
                      ? "bg-teal-50 border-teal-100"
                      : "bg-slate-50 border-slate-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    item.cancelled
                      ? "text-red-500"
                      : item.isCompleted
                        ? "text-teal-600"
                        : "text-slate-500"
                  }`}
                >
                  {item.cancelled
                    ? "Cancelled"
                    : item.isCompleted
                      ? "Completed"
                      : "Pending Consultation"}
                </Text>
              </View>

              {/* Cancel button for active appointments */}
              {!item.cancelled && !item.isCompleted && (
                <TouchableOpacity
                  onPress={() => cancelAppointment(item._id)}
                  className="mt-2 border border-red-100 bg-red-50 rounded-xl py-3 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-red-500 font-black text-xs uppercase tracking-widest">
                    Cancel Appointment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {appointments.length === 0 && (
          <View className="bg-white rounded-[24px] p-10 border border-slate-100 items-center">
            <Text className="text-5xl mb-4">📅</Text>
            <Text className="text-slate-900 font-black text-lg mb-2">
              No appointments
            </Text>
            <Text className="text-slate-400 text-sm font-medium text-center">
              Patient bookings will appear here
            </Text>
          </View>
        )}

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
