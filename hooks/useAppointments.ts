import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { Appointment } from "../types";
import { API_PATHS } from "../utils/apiPath";
import axiosInstance from "../utils/axiosInstance";

/** The patient's appointments (with their medicines), reloaded whenever the screen comes into view. */
export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.USER.FETCH_APPOINTMENTS);
      if (data.success) setAppointments(data.appointments);
    } catch {
      setAppointments((a) => a ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  /** Records a dose. An early one asks first, because the doctor is told about it. */
  const takeDose = (appointmentId: string, name: string, early: boolean) => {
    const send = async (overdoseAlert: boolean) => {
      setSaving(`${appointmentId}-${name}`);
      try {
        const { data } = await axiosInstance.post(API_PATHS.USER.LOG_DOSE, { appointmentId, medicineName: name, overdoseAlert });
        if (data.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Alert.alert("Couldn't save that", data.message);
        await load();
      } catch {
        Alert.alert("Couldn't save that", "Check your connection and try again.");
      } finally {
        setSaving(null);
      }
    };
    if (early) {
      Alert.alert("It's early for this dose", `Your next ${name} isn't due yet. If you take it now, your doctor will be told.`, [
        { text: "Not Now", style: "cancel" },
        { text: "I Took It", style: "destructive", onPress: () => send(true) },
      ]);
    } else send(false);
  };

  return { appointments, refreshing, refresh, reload: load, takeDose, saving };
}
