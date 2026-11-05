import { useRouter } from "expo-router";
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import { colors, Empty, Page, Row, RowButton, Section } from "../../../components/native";
import { useAppointments } from "../../../hooks/useAppointments";
import type { Appointment } from "../../../types";
import { API_PATHS } from "../../../utils/apiPath";
import axiosInstance from "../../../utils/axiosInstance";
import { choosePayment, joinVideoVisit, walletSpendableCents } from "../../../utils/payment";
import { clock, isOpen, shortDay, slotStart, unpaidHold } from "../../../utils/schedule";

type Action = { label: string; run: () => void; destructive?: boolean };

/** The iPhone action sheet; on Android an alert with the same choices. */
function chooseAction(title: string, actions: Action[]) {
  if (Platform.OS === "ios") {
    const labels = [...actions.map((a) => a.label), "Close"];
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: labels, cancelButtonIndex: labels.length - 1, destructiveButtonIndex: actions.findIndex((a) => a.destructive) },
      (i) => actions[i]?.run(),
    );
  } else {
    Alert.alert(title, undefined, [...actions.map((a) => ({ text: a.label, onPress: a.run, style: a.destructive ? ("destructive" as const) : undefined })), { text: "Close", style: "cancel" }]);
  }
}

const when = (a: Appointment) => {
  const at = slotStart(a);
  return at ? `${shortDay(at)}, ${clock(at)}` : `${a.slotDate.replace(/_/g, "/")}, ${a.slotTime}`;
};

/** What happened to a past visit, in words. */
const outcome = (a: Appointment) => {
  if (a.cancelled) return a.refund ? `Cancelled · $${a.refund.amount} refunded` : "Cancelled";
  if (a.missed?.by === "patient") return "Missed by you";
  if (a.missed?.by === "doctor") return `Missed by the doctor${a.refund ? ` · $${a.refund.amount} refunded` : ""}`;
  return "Completed";
};

export default function VisitsScreen() {
  const router = useRouter();
  const { appointments, refreshing, refresh, reload } = useAppointments();
  const [busy, setBusy] = useState<string | null>(null);

  const cancel = (a: Appointment) => {
    const hold = !a.payment;
    Alert.alert(hold ? "Release this time?" : "Cancel this visit?", hold ? "You haven't paid, so nothing is charged." : "You get the full fee back.", [
      { text: "Keep It", style: "cancel" },
      {
        text: hold ? "Release" : "Cancel Visit",
        style: "destructive",
        onPress: async () => {
          setBusy(a._id);
          try {
            const { data } = await axiosInstance.post(API_PATHS.USER.CANCEL_APPOINTMENT, { appointmentId: a._id });
            if (!data.success) Alert.alert("Couldn't cancel", data.message);
          } catch (err: any) {
            Alert.alert("Couldn't cancel", err.response?.data?.message || "Try again");
          } finally {
            setBusy(null);
            reload();
          }
        },
      },
    ]);
  };

  const pay = async (a: Appointment) => {
    setBusy(a._id);
    try {
      await choosePayment(a._id, a.amount, "$", await walletSpendableCents());
    } finally {
      setBusy(null);
      reload();
    }
  };

  const open = (a: Appointment) => {
    const actions: Action[] = [];
    if (!a.payment) actions.push({ label: `Pay $${a.amount}`, run: () => pay(a) });
    if (a.payment && a.kind === "video") actions.push({ label: "Join Video Call", run: () => joinVideoVisit(API_PATHS.USER.VIDEO_JOIN(a._id)) });
    actions.push({ label: "Message Doctor", run: () => router.push({ pathname: "/messages/[docId]", params: { docId: a.docId, name: a.docData?.name } }) });
    actions.push({ label: a.payment ? "Cancel Visit" : "Release This Time", run: () => cancel(a), destructive: true });
    chooseAction(`${a.docData?.name} · ${when(a)}`, actions);
  };

  const list = [...(appointments ?? [])].sort((x, y) => (slotStart(x)?.getTime() ?? 0) - (slotStart(y)?.getTime() ?? 0));
  const holds = list.filter((a) => unpaidHold(a));
  const upcoming = list.filter((a) => isOpen(a) && a.payment);
  const past = list.filter((a) => !isOpen(a)).reverse().slice(0, 20);

  const kindIcon = (a: Appointment, dim?: boolean) =>
    a.kind === "video"
      ? { ios: "video.fill" as const, android: "videocam", bg: dim ? colors.gray : colors.purple }
      : { ios: "cross.case.fill" as const, android: "medical_services", bg: dim ? colors.gray : colors.tint };

  return (
    <>
      <Page
        title="Visits"
        subtitle="Your appointments"
        right={<RowButton label="Book" filled onPress={() => router.push("/doctors")} />}
        loading={!appointments}
        refreshing={refreshing}
        onRefresh={refresh}
      >
        {appointments && !holds.length && !upcoming.length && !past.length ? (
          <Empty
            icon="calendar"
            title="No visits yet"
            message="Book a clinic visit or a video call with one of our doctors."
            action={<RowButton label="Find a Doctor" filled onPress={() => router.push("/doctors")} />}
          />
        ) : null}

        <Section title="Needs payment" footer={holds.length ? "We hold the time for 30 minutes while you pay. After that it's released." : undefined}>
          {holds.map((a) => {
            const minutes = Math.max(1, Math.round((new Date(a.holdExpiresAt!).getTime() - Date.now()) / 60_000));
            return (
              <Row
                key={a._id}
                icon={{ ios: "clock.badge.exclamationmark.fill", android: "schedule", bg: colors.orange }}
                title={a.docData?.name ?? "Visit"}
                subtitle={`${when(a)} · ${minutes} min left`}
                subtitleColor={colors.orange}
                trailing={<RowButton label={`Pay $${a.amount}`} filled busy={busy === a._id} onPress={() => pay(a)} />}
                onPress={() => open(a)}
              />
            );
          })}
        </Section>

        <Section title="Upcoming">
          {upcoming.map((a) => (
            <Row
              key={a._id}
              icon={kindIcon(a)}
              title={a.docData?.name ?? "Visit"}
              subtitle={`${when(a)} · ${a.kind === "video" ? "Video" : "At the clinic"}`}
              trailing={a.kind === "video" ? <RowButton label="Join" color={colors.purple} onPress={() => joinVideoVisit(API_PATHS.USER.VIDEO_JOIN(a._id))} /> : undefined}
              chevron={a.kind !== "video"}
              onPress={() => open(a)}
            />
          ))}
        </Section>

        <Section title="Past">
          {past.map((a) => (
            <Row
              key={a._id}
              icon={kindIcon(a, true)}
              title={a.docData?.name ?? "Visit"}
              subtitle={`${when(a)} · ${outcome(a)}`}
              onPress={() => router.push({ pathname: "/messages/[docId]", params: { docId: a.docId, name: a.docData?.name } })}
              chevron
              accessibilityLabel={`${a.docData?.name}, ${outcome(a)}. Message the doctor`}
            />
          ))}
        </Section>
      </Page>
    </>
  );
}
