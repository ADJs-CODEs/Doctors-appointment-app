import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Availability, Doctor, VisitKind } from "../../types";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";
import { choosePayment, walletSpendableCents } from "../../utils/payment";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Booking, the same way as the website: pick clinic or video, a day and a free time. Booking
 * holds the time for 30 minutes; paying (wallet or card) confirms it.
 */
export default function BookScreen() {
  // ?type=video opens on video (the camera button in a chat)
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [kind, setKind] = useState<VisitKind>(type === "video" ? "video" : "in-person");
  const [slots, setSlots] = useState<Availability | null>(null);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(API_PATHS.DOCTORS.LIST)
      .then(({ data }) => setDoctor(data.doctors?.find((d: Doctor) => d._id === id) ?? null))
      .catch(() => Alert.alert("Couldn't load this doctor"));
  }, [id]);

  const loadSlots = useCallback(async () => {
    setSlots(null);
    setTime(null);
    setDay(0);
    try {
      const { data } = await axiosInstance.get(API_PATHS.AVAILABILITY(id, kind));
      if (data.success) {
        setSlots(data);
        // clinic not offered but video is: switch straight to video
        if (kind === "in-person" && !data.offersInPerson && data.offersVideo) setKind("video");
      }
    } catch {
      Alert.alert("Couldn't load free times");
    }
  }, [id, kind]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const fee = kind === "video" ? slots?.videoFees ?? doctor?.videoFees ?? 0 : slots?.fees ?? doctor?.fees ?? 0;
  const days = (slots?.days ?? []).filter((d) => d.slots.length);
  const today = days[day];

  const book = async () => {
    if (!today || !time) return;
    setBooking(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.USER.BOOK_APPOINTMENT, { docId: id, slotDate: today.slotDate, slotTime: time, kind });
      if (!data.success) {
        Alert.alert("Couldn't book", data.message);
        loadSlots();
        return;
      }
      const paid = await choosePayment(String(data.appointmentId), fee, "$", await walletSpendableCents());
      if (!paid) Alert.alert("Time held", "We're holding this time for 30 minutes. Pay from Bookings to confirm it.");
      router.replace("/(tabs)/visits");
    } catch (err: any) {
      Alert.alert("Couldn't book", err.response?.data?.message || err.message);
      loadSlots();
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="bg-slate-900 px-6 pt-14 pb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-4" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row gap-4 items-center">
            <Image source={{ uri: doctor.image }} style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: "#134e4a" }} contentFit="cover" contentPosition="top" />
            <View className="flex-1">
              <Text className="text-white text-2xl font-black">{doctor.name}</Text>
              <Text className="text-teal-300 text-xs font-bold uppercase tracking-wider mt-0.5">
                {doctor.speciality} · {doctor.degree}
              </Text>
              <Text className="text-slate-400 text-xs mt-1">{doctor.experience} experience</Text>
            </View>
          </View>
          <Text className="text-slate-300 text-sm leading-5 mt-4" numberOfLines={5}>
            {doctor.about}
          </Text>
        </View>

        <View className="px-4 pt-5">
          {!doctor.available ? (
            <View className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <Text className="text-amber-800 font-bold">This doctor isn&apos;t taking bookings right now.</Text>
            </View>
          ) : (
            <>
              {/* clinic or video */}
              <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 ml-1">Type of visit</Text>
              <View className="flex-row gap-2 mb-5">
                {(
                  [
                    { k: "in-person" as const, label: "At the clinic", icon: "business" as const, offered: slots?.offersInPerson ?? true, price: slots?.fees ?? doctor.fees },
                    { k: "video" as const, label: "Video call", icon: "videocam" as const, offered: slots?.offersVideo ?? !!doctor.videoFees, price: slots?.videoFees ?? doctor.videoFees },
                  ]
                ).map((o) => {
                  const on = kind === o.k;
                  return (
                    <TouchableOpacity
                      key={o.k}
                      disabled={!o.offered}
                      onPress={() => setKind(o.k)}
                      className={`flex-1 rounded-2xl p-4 border ${on ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"} ${o.offered ? "" : "opacity-40"}`}
                    >
                      <Ionicons name={o.icon} size={20} color={on ? "#5eead4" : "#0d9488"} />
                      <Text className={`font-black mt-2 ${on ? "text-white" : "text-slate-900"}`}>{o.label}</Text>
                      <Text className={`text-xs mt-0.5 ${on ? "text-slate-300" : "text-slate-500"}`}>{o.offered ? `$${o.price}` : "Not offered"}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* day */}
              <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 ml-1">Day</Text>
              {slots === null ? (
                <ActivityIndicator color="#14b8a6" style={{ marginVertical: 24 }} />
              ) : days.length === 0 ? (
                <View className="bg-white rounded-2xl p-5 border border-slate-100">
                  <Text className="text-slate-900 font-black">No free times in the next two weeks</Text>
                  <Text className="text-slate-400 text-sm mt-1">{kind === "video" ? "Try a clinic visit instead." : "Check again soon."}</Text>
                </View>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {days.map((d, i) => {
                      const date = new Date(`${d.iso}T12:00:00`);
                      const on = i === day;
                      return (
                        <TouchableOpacity
                          key={d.slotDate}
                          onPress={() => {
                            setDay(i);
                            setTime(null);
                          }}
                          className={`w-16 py-3 rounded-2xl items-center border ${on ? "bg-teal-600 border-teal-600" : "bg-white border-slate-200"}`}
                        >
                          <Text className={`text-[11px] font-bold ${on ? "text-teal-100" : "text-slate-400"}`}>{WEEKDAY[d.weekday]}</Text>
                          <Text className={`text-xl font-black ${on ? "text-white" : "text-slate-900"}`}>{date.getDate()}</Text>
                          <Text className={`text-[10px] font-bold ${on ? "text-teal-100" : "text-slate-400"}`}>{MONTH[date.getMonth()]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* time */}
                  <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mt-5 mb-2 ml-1">Time</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {today?.slots.map((s) => {
                      const on = s === time;
                      return (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setTime(s)}
                          className={`px-4 py-2.5 rounded-xl border ${on ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
                        >
                          <Text className={`text-sm font-bold ${on ? "text-white" : "text-slate-700"}`}>{s}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {doctor.available && (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-slate-100 px-4 pt-3 pb-8">
          <TouchableOpacity
            onPress={book}
            disabled={!time || booking}
            className={`rounded-2xl py-4 items-center ${time ? "bg-teal-600" : "bg-slate-200"}`}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`font-black ${time ? "text-white" : "text-slate-400"}`}>
                {time && today ? `Book ${WEEKDAY[today.weekday]} at ${time} · $${fee}` : "Pick a time"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
