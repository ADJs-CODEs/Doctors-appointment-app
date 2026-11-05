import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar, BackButton, Button, colors, font, Page, Row, RowButton, Section, text } from "../components/native";
import type { Connection } from "../types";
import { API_PATHS } from "../utils/apiPath";
import axiosInstance from "../utils/axiosInstance";

// same short messages as the website (the server checks the kind)
const NUDGES: { kind: string; label: string }[] = [
  { kind: "love", label: "❤️ Thinking of you" },
  { kind: "medicine", label: "💊 Have you taken your medicine?" },
  { kind: "checkin", label: "🙂 How are you feeling today?" },
  { kind: "water", label: "💧 Remember to drink some water" },
  { kind: "rest", label: "🛌 Get some rest, okay?" },
  { kind: "call", label: "📞 Call me when you can" },
  { kind: "okay", label: "✅ I'm okay, don't worry" },
  { kind: "thanks", label: "🙏 Thank you for checking on me" },
];

const errorText = (e: any, fallback: string) => e?.response?.data?.message ?? e?.message ?? fallback;

/**
 * The care circle: family and friends who watch over your health (they see your visits and doses,
 * and hear if you miss one), the people you watch over, and short check-in nudges between you.
 */
export default function CareCircleScreen() {
  const router = useRouter();
  const [watching, setWatching] = useState<Connection[] | null>(null);
  const [watchers, setWatchers] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        axiosInstance.get(API_PATHS.CONNECTIONS.WATCHING_OVER),
        axiosInstance.get(API_PATHS.CONNECTIONS.MY_WATCHERS),
        axiosInstance.get(API_PATHS.CONNECTIONS.MY_REQUESTS),
      ]);
      setWatching(a.data.watching ?? []);
      setWatchers(b.data.watchers ?? []);
      setRequests((c.data.requests ?? []).filter((r: Connection) => r.status === "pending"));
    } catch {
      setWatching((w) => w ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const invite = async () => {
    const patientEmail = email.trim().toLowerCase();
    if (!patientEmail) return;
    setBusy("invite");
    try {
      const { data } = await axiosInstance.post(API_PATHS.CONNECTIONS.REQUEST, { patientEmail });
      if (!data.success) throw new Error(data.message);
      setEmail("");
      Alert.alert("Request sent", "They'll get an email, and can accept in their Clarity app.");
      load();
    } catch (e) {
      Alert.alert("Couldn't send it", errorText(e, "Try again."));
    } finally {
      setBusy(null);
    }
  };

  const respond = async (id: string, action: "accepted" | "rejected") => {
    setBusy(id);
    try {
      const { data } = await axiosInstance.post(API_PATHS.CONNECTIONS.RESPOND, { connectionId: id, action });
      if (!data.success) throw new Error(data.message);
      load();
    } catch (e) {
      Alert.alert("Couldn't save that", errorText(e, "Try again."));
    } finally {
      setBusy(null);
    }
  };

  const remove = (c: Connection, name: string) =>
    Alert.alert(`Remove ${name}?`, "They won't see your health updates any more, and you won't see theirs.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await axiosInstance.post(API_PATHS.CONNECTIONS.REMOVE, { connectionId: c._id });
          } finally {
            load();
          }
        },
      },
    ]);

  const nudge = (toUserId: string, name: string) => {
    const send = async (kind: string) => {
      try {
        const { data } = await axiosInstance.post(API_PATHS.CONNECTIONS.NUDGE, { toUserId, kind });
        if (!data.success) throw new Error(data.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Alert.alert("Not sent", errorText(e, "Try again in a minute."));
      }
    };
    if (Platform.OS === "ios") {
      const labels = [...NUDGES.map((n) => n.label), "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions({ title: `Send ${name} a nudge`, options: labels, cancelButtonIndex: labels.length - 1 }, (i) => NUDGES[i] && send(NUDGES[i].kind));
    } else {
      Alert.alert(`Send ${name} a nudge`, undefined, [...NUDGES.slice(0, 5).map((n) => ({ text: n.label, onPress: () => send(n.kind) })), { text: "Cancel", style: "cancel" }]);
    }
  };

  return (
    <Page
      title="Care circle"
      subtitle="Family and friends"
      right={<BackButton />}
      loading={!watching}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <LinearGradient colors={["#2A1A5E", "#14365F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <View style={st.glow} />
          <Text style={st.eyebrow}>Watch over each other</Text>
          <Text style={st.title}>The people you trust see how you're doing</Text>
          <Text style={st.line}>They see your visits and doses, and get a message if you miss one. Never your messages with your doctor.</Text>
          <View style={st.stats}>
            <Stat n={watchers.length} label="watching over you" />
            <Stat n={watching?.length ?? 0} label="you watch over" />
          </View>
        </LinearGradient>
      </View>

      <Section title="Requests">
        {requests.map((r) => (
          <Row
            key={r._id}
            leading={<Avatar name={r.requester?.name ?? "?"} image={r.requester?.image} size={42} round />}
            title={r.requester?.name ?? "Someone"}
            subtitle="Wants to watch over your health"
            trailing={
              <View style={{ flexDirection: "row", gap: 6 }}>
                <RowButton label="No" color={colors.ink3} onPress={() => respond(r._id, "rejected")} />
                <RowButton label="Accept" filled color={colors.tint} busy={busy === r._id} onPress={() => respond(r._id, "accepted")} />
              </View>
            }
          />
        ))}
      </Section>

      <Section title="Watching over you" footer={watchers.length ? undefined : "Nobody yet. Share the email you use for Clarity with someone you trust and ask them to add you."}>
        {watchers.length
          ? watchers.map((c) => (
              <Row
                key={c._id}
                leading={<Avatar name={c.watcher?.name ?? "?"} image={c.watcher?.image} size={42} round />}
                title={c.watcher?.name ?? "Someone"}
                subtitle={c.watcher?.email}
                trailing={<RowButton label="Nudge" onPress={() => nudge(c.requesterId, c.watcher?.name?.split(" ")[0] ?? "them")} />}
                onPress={() => remove(c, c.watcher?.name ?? "them")}
                accessibilityLabel={`${c.watcher?.name}. Tap to remove`}
              />
            ))
          : [<Row key="none" icon={{ ios: "person.crop.circle.badge.plus", android: "person_add", bg: colors.video }} title="No one yet" />]}
      </Section>

      <Section title="You watch over">
        {(watching ?? []).map((c) => (
          <Row
            key={c._id}
            leading={<Avatar name={c.patient?.name ?? "?"} image={c.patient?.image} size={42} round />}
            title={c.patient?.name ?? "Someone"}
            subtitle="See their visits and doses"
            trailing={<RowButton label="Nudge" onPress={() => nudge(c.patientId, c.patient?.name?.split(" ")[0] ?? "them")} />}
            chevron
            onPress={() => router.push(`/patient/${c.patientId}`)}
          />
        ))}
      </Section>

      <View style={{ marginHorizontal: 16, marginTop: 20 }}>
        <Text style={[text.h2, { marginHorizontal: 4, marginBottom: 10 }]}>Watch over someone</Text>
        <View style={st.invite}>
          <Text style={text.body}>Enter the email they use for Clarity. They'll be asked to accept.</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="their@email.com"
            placeholderTextColor={colors.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Their email"
            style={st.input}
          />
          <Button label="Send request" tone="ink" busy={busy === "invite"} onPress={invite} />
        </View>
      </View>
    </Page>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: font.num, fontSize: 26, color: "#FFFFFF" }}>{n}</Text>
      <Text style={{ fontFamily: font.semibold, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: 26, padding: 20, overflow: "hidden" },
  glow: { position: "absolute", right: -70, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(139,92,246,0.3)" },
  eyebrow: { fontFamily: font.bold, fontSize: 13, color: "#C4B5FD" },
  title: { fontFamily: font.heavy, fontSize: 20, color: "#FFFFFF", marginTop: 4, letterSpacing: -0.3 },
  line: { fontFamily: font.regular, fontSize: 14, color: "rgba(255,255,255,0.72)", marginTop: 6, lineHeight: 20 },
  stats: { flexDirection: "row", gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.2)" },
  invite: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, fontFamily: font.regular, fontSize: 15, color: colors.ink },
});
