import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Appointment } from "../../types";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";
import { choosePayment, joinVideoVisit, walletSpendableCents } from "../../utils/payment";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const slotDateFormat = (slotDate: string) => {
  const [d, m, y] = slotDate.split("_");
  return `${d} ${MONTHS[Number(m)]} ${y}`;
};
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const isHold = (a: Appointment) => !!a.holdExpiresAt && !a.payment;
const isOpen = (a: Appointment) => !a.isCompleted && !a.cancelled && !a.missed;

/** What happened to a closed visit, in words. */
const closedLabel = (a: Appointment) => {
  if (a.cancelled) return { text: "Cancelled", tone: "red" as const };
  if (a.missed?.by === "patient") return { text: "Missed by you", tone: "amber" as const };
  if (a.missed?.by === "doctor") return { text: "Missed by the doctor", tone: "amber" as const };
  return { text: "Completed", tone: "teal" as const };
};
const TONES = {
  red: { box: "bg-red-50 border-red-100", text: "text-red-500" },
  amber: { box: "bg-amber-50 border-amber-100", text: "text-amber-700" },
  teal: { box: "bg-teal-50 border-teal-100", text: "text-teal-600" },
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.USER.FETCH_APPOINTMENTS);
      if (data.success) setAppointments([...data.appointments].reverse());
    } catch {
      setAppointments((a) => a ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // refresh whenever the tab is opened (e.g. coming back from booking or paying)
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments]),
  );

  const cancel = (a: Appointment) => {
    const hold = isHold(a);
    Alert.alert(hold ? "Release this time?" : "Cancel appointment?", hold ? "You haven't paid, so nothing is charged." : "Paid visits are refunded.", [
      { text: "Keep it", style: "cancel" },
      {
        text: hold ? "Release" : "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setBusy(a._id);
          try {
            const { data } = await axiosInstance.post(API_PATHS.USER.CANCEL_APPOINTMENT, { appointmentId: a._id });
            if (!data.success) Alert.alert("Couldn't cancel", data.message);
            fetchAppointments();
          } catch (err: any) {
            Alert.alert("Couldn't cancel", err.response?.data?.message || "Try again");
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const pay = async (a: Appointment) => {
    setBusy(a._id);
    try {
      await choosePayment(a._id, a.amount, "$", await walletSpendableCents());
      fetchAppointments();
    } finally {
      setBusy(null);
    }
  };

  if (appointments === null) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  const upcoming = appointments.filter(isOpen);
  const past = appointments.filter((a) => !isOpen(a));

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} tintColor="#14b8a6" />}
    >
      <View className="bg-slate-900 px-6 pt-16 pb-8 flex-row items-end justify-between">
        <View>
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">ADJs CODEs</Text>
          <Text className="text-white text-3xl font-black">My Appointments</Text>
          <Text className="text-slate-400 text-sm font-medium mt-1">
            {upcoming.length} upcoming · {past.length} past
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/doctors")} className="bg-teal-500 rounded-xl px-3 py-2 flex-row items-center gap-1">
          <Ionicons name="add" size={16} color="#0f172a" />
          <Text className="text-slate-900 font-black text-xs">Book</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-4">
        {upcoming.length > 0 ? (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">Upcoming</Text>
            {upcoming.map((item) => {
              const hold = isHold(item);
              const video = item.kind === "video";
              return (
                <View key={item._id} className={`bg-white rounded-[24px] p-5 mb-3 border shadow-sm ${hold ? "border-amber-200" : "border-slate-100"}`}>
                  {hold && (
                    <View className="bg-amber-50 rounded-xl px-3 py-2 mb-4">
                      <Text className="text-amber-800 text-xs font-bold">
                        Held for you until {clock(item.holdExpiresAt!)}. Pay to confirm it, or it&apos;s released.
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center border ${video ? "bg-violet-50 border-violet-100" : "bg-teal-50 border-teal-100"}`}>
                      <Ionicons name={video ? "videocam" : "business"} size={22} color={video ? "#7c3aed" : "#0d9488"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">{item.docData?.name}</Text>
                      <Text className="text-teal-500 text-xs font-bold uppercase tracking-wider">
                        {item.docData?.speciality} · {video ? "Video call" : "At the clinic"}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full border ${item.payment ? "bg-teal-50 border-teal-100" : "bg-amber-50 border-amber-100"}`}>
                      <Text className={`text-[10px] font-black uppercase ${item.payment ? "text-teal-600" : "text-amber-600"}`}>{item.payment ? "Paid" : "Unpaid"}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                      <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">Date</Text>
                      <Text className="text-slate-900 font-black text-sm">{slotDateFormat(item.slotDate)}</Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                      <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">Time</Text>
                      <Text className="text-slate-900 font-black text-sm">{item.slotTime}</Text>
                    </View>
                    <View className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                      <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">Fee</Text>
                      <Text className="text-slate-900 font-black text-sm">${item.amount}</Text>
                    </View>
                  </View>

                  {busy === item._id ? (
                    <ActivityIndicator color="#14b8a6" style={{ paddingVertical: 12 }} />
                  ) : (
                    <View className="flex-row gap-2">
                      {!item.payment ? (
                        <TouchableOpacity onPress={() => pay(item)} className="flex-1 bg-teal-600 rounded-xl py-3 items-center">
                          <Text className="text-white font-black text-xs uppercase tracking-widest">Pay ${item.amount}</Text>
                        </TouchableOpacity>
                      ) : (
                        video && (
                          <TouchableOpacity onPress={() => joinVideoVisit(API_PATHS.USER.VIDEO_JOIN(item._id))} className="flex-1 bg-violet-600 rounded-xl py-3 flex-row items-center justify-center gap-1.5">
                            <Ionicons name="videocam" size={15} color="#fff" />
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Join call</Text>
                          </TouchableOpacity>
                        )
                      )}
                      <TouchableOpacity onPress={() => cancel(item)} className="flex-1 border border-red-100 bg-red-50 rounded-xl py-3 items-center" activeOpacity={0.7}>
                        <Text className="text-red-500 font-black text-xs uppercase tracking-widest">{hold ? "Release" : "Cancel"}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-white rounded-[24px] p-8 mb-6 items-center border border-slate-100">
            <Ionicons name="calendar-outline" size={40} color="#14b8a6" />
            <Text className="text-slate-900 font-black text-lg mt-3 mb-1">No upcoming appointments</Text>
            <Text className="text-slate-400 text-sm font-medium text-center mb-4">Book a clinic visit or a video call with a specialist.</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/doctors")} className="bg-slate-900 rounded-xl px-5 py-3">
              <Text className="text-white font-black text-xs uppercase tracking-widest">Find a doctor</Text>
            </TouchableOpacity>
          </View>
        )}

        {past.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">Past</Text>
            {past.map((item) => {
              const label = closedLabel(item);
              return (
                <View key={item._id} className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
                      <Ionicons name={item.kind === "video" ? "videocam-outline" : "business-outline"} size={22} color="#94a3b8" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">{item.docData?.name}</Text>
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.docData?.speciality}</Text>
                      <Text className="text-slate-400 text-xs font-medium mt-0.5">
                        {slotDateFormat(item.slotDate)} · {item.slotTime}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full border ${TONES[label.tone].box}`}>
                      <Text className={`text-[10px] font-black uppercase ${TONES[label.tone].text}`}>{label.text}</Text>
                    </View>
                  </View>

                  {item.refund && (
                    <Text className="text-slate-500 text-xs mt-3">
                      {item.refund.percent}% refunded (${item.refund.amount}){item.refund.status === "refunded" ? "" : " · the clinic is sending it"}
                    </Text>
                  )}

                  {item.isCompleted && item.healthData && (
                    <View className="mt-4 pt-4 border-t border-slate-50">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Recorded vitals</Text>
                      <View className="flex-row gap-2">
                        {[
                          { label: "HR", value: item.healthData.heartRate ? `${item.healthData.heartRate} BPM` : "" },
                          { label: "BP", value: item.healthData.bloodPressure },
                          { label: "Temp", value: item.healthData.temperature ? `${item.healthData.temperature}°C` : "" },
                        ].map((v) => (
                          <View key={v.label} className="flex-1 bg-slate-50 rounded-xl p-2 items-center border border-slate-100">
                            <Text className="text-slate-400 text-[9px] font-black uppercase">{v.label}</Text>
                            <Text className="text-slate-900 font-black text-xs mt-0.5">{v.value || "--"}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
