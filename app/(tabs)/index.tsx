import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
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

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.USER.FETCH_APPOINTMENTS,
      );
      if (data.success) setAppointments(data.appointments.reverse());
    } catch (error) {
      console.error("Failed to fetch:", error);
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

  const nextAppointment = appointments.find(
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

  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#0f172a",
            paddingTop: 60,
            paddingBottom: 32,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{ color: "#94a3b8", fontSize: 14, fontWeight: "500" }}
              >
                {greeting}
              </Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: "800",
                  marginTop: 2,
                }}
              >
                {firstName} 👋
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#2dd4bf"
              />
            </TouchableOpacity>
          </View>

          {/* Vitals row */}
          {latestVitals ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                {
                  label: "Heart Rate",
                  value: latestVitals.heartRate,
                  unit: "BPM",
                  icon: "heart",
                  color: "#f43f5e",
                },
                {
                  label: "Blood Pressure",
                  value: latestVitals.bloodPressure,
                  unit: "",
                  icon: "speedometer",
                  color: "#3b82f6",
                },
                {
                  label: "Temperature",
                  value: latestVitals.temperature,
                  unit: "°C",
                  icon: "thermometer",
                  color: "#f97316",
                },
              ].map((v, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Ionicons name={v.icon as any} size={16} color={v.color} />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "800",
                      marginTop: 6,
                    }}
                  >
                    {v.value || "--"}
                    {v.unit}
                  </Text>
                  <Text
                    style={{
                      color: "#94a3b8",
                      fontSize: 10,
                      fontWeight: "600",
                      marginTop: 2,
                    }}
                  >
                    {v.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/doctors")}
              style={{
                backgroundColor: "rgba(13,148,136,0.2)",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(13,148,136,0.3)",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2dd4bf" />
              <Text
                style={{ color: "#2dd4bf", fontSize: 13, fontWeight: "700" }}
              >
                Book your first appointment to see vitals
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          {/* Quick actions */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {[
              {
                label: "Find Doctor",
                icon: "search",
                color: "#0d9488",
                bg: "#f0fdfa",
                border: "#99f6e4",
                route: "/(tabs)/doctors",
              },
              {
                label: "My Bookings",
                icon: "calendar",
                color: "#3b82f6",
                bg: "#eff6ff",
                border: "#bfdbfe",
                route: "/(tabs)/appointments",
              },
              {
                label: "Medications",
                icon: "medkit",
                color: "#8b5cf6",
                bg: "#f5f3ff",
                border: "#ddd6fe",
                route: "/(tabs)/medications",
              },
              {
                label: "Watch Over",
                icon: "eye",
                color: "#f97316",
                bg: "#fff7ed",
                border: "#fed7aa",
                route: "/(tabs)/watching",
              },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push(action.route as any)}
                style={{
                  flex: 1,
                  backgroundColor: action.bg,
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: action.border,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                    padding: 8,
                    marginBottom: 6,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={18}
                    color={action.color}
                  />
                </View>
                <Text
                  style={{
                    color: "#334155",
                    fontSize: 9,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Next appointment */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: "#334155",
                fontSize: 16,
                fontWeight: "800",
                marginBottom: 12,
              }}
            >
              Next Appointment
            </Text>
            {nextAppointment ? (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/appointments")}
                style={{
                  backgroundColor: "#0f172a",
                  borderRadius: 24,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                }}
                activeOpacity={0.9}
              >
                <View
                  style={{
                    backgroundColor: "rgba(13,148,136,0.2)",
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "rgba(13,148,136,0.3)",
                  }}
                >
                  <Ionicons name="medical" size={24} color="#2dd4bf" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    {nextAppointment.docData?.name}
                  </Text>
                  <Text
                    style={{
                      color: "#2dd4bf",
                      fontSize: 11,
                      fontWeight: "600",
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {nextAppointment.docData?.speciality}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color="#94a3b8"
                      />
                      <Text
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {slotDateFormat(nextAppointment.slotDate)}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="time-outline" size={11} color="#94a3b8" />
                      <Text
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {nextAppointment.slotTime}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/doctors")}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 24,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderStyle: "dashed",
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    backgroundColor: "#f0fdfa",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name="calendar-outline" size={28} color="#0d9488" />
                </View>
                <Text
                  style={{
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: "800",
                    marginBottom: 4,
                  }}
                >
                  No upcoming appointments
                </Text>
                <Text
                  style={{
                    color: "#94a3b8",
                    fontSize: 13,
                    fontWeight: "500",
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  Book a consultation with a specialist
                </Text>
                <View
                  style={{
                    backgroundColor: "#0d9488",
                    borderRadius: 14,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Find a Doctor
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Active meds preview */}
          {activeMeds.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: "#334155", fontSize: 16, fontWeight: "800" }}
                >
                  Active Medications
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/medications")}
                >
                  <Text
                    style={{
                      color: "#0d9488",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              {activeMeds.slice(0, 2).map((med, i) => {
                const pct = Math.round(
                  ((med.totalQuantity - med.remainingQuantity) /
                    med.totalQuantity) *
                    100,
                );
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 18,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: "#f1f5f9",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#f0fdfa",
                        borderRadius: 12,
                        padding: 10,
                      }}
                    >
                      <Ionicons name="medical" size={20} color="#0d9488" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#0f172a",
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {med.name}
                      </Text>
                      <Text
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: "500",
                          marginTop: 2,
                        }}
                      >
                        {med.dosagePerDay}x daily · {med.remainingQuantity}{" "}
                        remaining
                      </Text>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "#f1f5f9",
                          borderRadius: 2,
                          marginTop: 8,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor:
                              pct > 80
                                ? "#0d9488"
                                : pct > 40
                                  ? "#f59e0b"
                                  : "#ef4444",
                            borderRadius: 2,
                          }}
                        />
                      </View>
                    </View>
                    <Text
                      style={{
                        color: "#0d9488",
                        fontSize: 13,
                        fontWeight: "800",
                      }}
                    >
                      {pct}%
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </>
  );
}
