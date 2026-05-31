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
import { useAuth } from "../../context/AuthContext";
import type { Appointment } from "../../types";
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

export default function AppointmentsScreen() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAppointments = async () => {
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

  const cancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(appointmentId);
              const { data } = await axiosInstance.post(
                API_PATHS.USER.CANCEL_APPOINTMENT,
                { appointmentId },
              );
              if (data.success) {
                fetchAppointments();
              } else {
                Alert.alert("Error", data.message);
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel",
              );
            } finally {
              setCancelling(null);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

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

  const upcoming = appointments.filter((a) => !a.isCompleted && !a.cancelled);
  const past = appointments.filter((a) => a.isCompleted || a.cancelled);

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
          ADJs CODEs
        </Text>
        <Text className="text-white text-3xl font-black">My Appointments</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          {upcoming.length} upcoming · {past.length} past
        </Text>
      </View>

      <View className="px-4 pt-4">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Upcoming
            </Text>
            {upcoming.map((item) => (
              <View
                key={item._id}
                className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm"
              >
                {/* Doctor info */}
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center border border-teal-100">
                    <Text className="text-2xl">🩺</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">
                      {item.docData?.name}
                    </Text>
                    <Text className="text-teal-500 text-xs font-bold uppercase tracking-wider">
                      {item.docData?.speciality}
                    </Text>
                  </View>
                  {item.payment ? (
                    <View className="bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                      <Text className="text-teal-600 text-[10px] font-black uppercase">
                        Paid
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                      <Text className="text-amber-600 text-[10px] font-black uppercase">
                        Unpaid
                      </Text>
                    </View>
                  )}
                </View>

                {/* Date and time */}
                <View className="flex-row gap-2 mb-4">
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

                {/* Fee */}
                <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
                  <Text className="text-slate-400 text-sm font-medium">
                    Consultation Fee
                  </Text>
                  <Text className="text-slate-900 font-black text-base">
                    ${item.amount}
                  </Text>
                </View>

                {/* Cancel button */}
                <TouchableOpacity
                  onPress={() => cancelAppointment(item._id)}
                  disabled={cancelling === item._id}
                  className="mt-3 border border-red-100 bg-red-50 rounded-xl py-3 items-center"
                  activeOpacity={0.7}
                >
                  {cancelling === item._id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text className="text-red-500 font-black text-xs uppercase tracking-widest">
                      Cancel Appointment
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Empty upcoming */}
        {upcoming.length === 0 && (
          <View className="bg-white rounded-[24px] p-8 mb-6 items-center border border-slate-100">
            <Text className="text-5xl mb-4">📅</Text>
            <Text className="text-slate-900 font-black text-lg mb-2">
              No upcoming appointments
            </Text>
            <Text className="text-slate-400 text-sm font-medium text-center">
              Visit our website to book a consultation with a specialist
            </Text>
          </View>
        )}

        {/* Past appointments */}
        {past.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
              Past
            </Text>
            {past.map((item) => (
              <View
                key={item._id}
                className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm opacity-75"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
                    <Text className="text-2xl">🩺</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">
                      {item.docData?.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {item.docData?.speciality}
                    </Text>
                    <Text className="text-slate-400 text-xs font-medium mt-0.5">
                      {slotDateFormat(item.slotDate)} · {item.slotTime}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border ${
                      item.cancelled
                        ? "bg-red-50 border-red-100"
                        : "bg-teal-50 border-teal-100"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black uppercase ${
                        item.cancelled ? "text-red-500" : "text-teal-600"
                      }`}
                    >
                      {item.cancelled ? "Cancelled" : "Completed"}
                    </Text>
                  </View>
                </View>

                {/* Health data if completed */}
                {item.isCompleted && item.healthData && (
                  <View className="mt-4 pt-4 border-t border-slate-50">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                      Recorded Vitals
                    </Text>
                    <View className="flex-row gap-2">
                      {[
                        {
                          label: "HR",
                          value: item.healthData.heartRate + " BPM",
                        },
                        { label: "BP", value: item.healthData.bloodPressure },
                        {
                          label: "Temp",
                          value: item.healthData.temperature + "°C",
                        },
                      ].map((v, i) => (
                        <View
                          key={i}
                          className="flex-1 bg-slate-50 rounded-xl p-2 items-center border border-slate-100"
                        >
                          <Text className="text-slate-400 text-[9px] font-black uppercase">
                            {v.label}
                          </Text>
                          <Text className="text-slate-900 font-black text-xs mt-0.5">
                            {v.value || "--"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
