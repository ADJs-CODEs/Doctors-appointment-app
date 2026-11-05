import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Doctor } from "../types";
import { API_PATHS } from "../utils/apiPath";
import axiosInstance from "../utils/axiosInstance";

// the same specialities the website filters by
const SPECIALITIES = ["General physician", "Gynecologist", "Dermatologist", "Pediatricians", "Neurologist", "Gastroenterologist"];

/** Find a doctor and open their booking page. */
export default function DoctorsScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [speciality, setSpeciality] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.DOCTORS.LIST);
      if (data.success) setDoctors(data.doctors);
    } catch {
      setDoctors((d) => d ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (doctors ?? [])
      .filter((d) => !speciality || d.speciality === speciality)
      .filter((d) => !q || `${d.name} ${d.speciality}`.toLowerCase().includes(q))
      // bookable doctors first
      .sort((a, b) => Number(b.available) - Number(a.available));
  }, [doctors, query, speciality]);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#14b8a6" />}
    >
      <View className="bg-slate-900 px-6 pt-16 pb-6">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">ADJs CODEs</Text>
        <Text className="text-white text-3xl font-black">Find a doctor</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">Book a clinic visit or a video call.</Text>
        <View className="flex-row items-center bg-white/10 rounded-2xl px-4 mt-5">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or speciality"
            placeholderTextColor="#94a3b8"
            className="flex-1 text-white py-3 px-3 text-sm"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}>
        {[null, ...SPECIALITIES].map((s) => {
          const on = speciality === s;
          return (
            <TouchableOpacity
              key={s ?? "all"}
              onPress={() => setSpeciality(s)}
              className={`px-4 py-2 rounded-full border ${on ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
            >
              <Text className={`text-xs font-bold ${on ? "text-white" : "text-slate-600"}`}>{s ?? "All"}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-4 pb-8">
        {doctors === null ? (
          <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
        ) : shown.length === 0 ? (
          <View className="bg-white rounded-[24px] p-8 items-center border border-slate-100">
            <Text className="text-slate-900 font-black text-lg">No doctors match</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">Try another speciality or search.</Text>
          </View>
        ) : (
          shown.map((d) => (
            <TouchableOpacity
              key={d._id}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: "/book/[id]", params: { id: d._id } })}
              className="bg-white rounded-[24px] p-4 mb-3 border border-slate-100 flex-row gap-4"
            >
              <Image source={{ uri: d.image }} style={{ width: 76, height: 76, borderRadius: 18, backgroundColor: "#f0fdfa" }} contentFit="cover" contentPosition="top" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <View className={`w-2 h-2 rounded-full ${d.available ? "bg-teal-500" : "bg-slate-300"}`} />
                  <Text className={`text-[11px] font-bold ${d.available ? "text-teal-600" : "text-slate-400"}`}>
                    {d.available ? "Taking bookings" : "Not taking bookings"}
                  </Text>
                </View>
                <Text className="text-slate-900 font-black text-base mt-1">{d.name}</Text>
                <Text className="text-slate-500 text-xs font-bold">
                  {d.speciality} · {d.experience}
                </Text>
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  <View className="bg-teal-50 px-2 py-0.5 rounded-full">
                    <Text className="text-teal-700 text-[11px] font-bold">Clinic ${d.fees}</Text>
                  </View>
                  {!!d.videoFees && (
                    <View className="bg-violet-50 px-2 py-0.5 rounded-full">
                      <Text className="text-violet-700 text-[11px] font-bold">Video ${d.videoFees}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ alignSelf: "center" }} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
