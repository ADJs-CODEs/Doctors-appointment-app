import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { type ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, Icon } from "../../../components/native";
import { API_PATHS } from "../../../utils/apiPath";
import axiosInstance from "../../../utils/axiosInstance";
import { clock, shortDay, slotStart } from "../../../utils/schedule";

type Message = { _id: string; text: string; sender: "patient" | "doctor"; createdAt: string; urgent?: boolean; appointmentId?: string; medicineName?: string };
type Visit = { _id: string; slotDate: string; slotTime: string; kind: "in-person" | "video"; medicines: string[] };
type Topic = { appointmentId?: string; medicineName?: string };

const visitDay = (v: Visit) => {
  const d = slotStart(v);
  return d ? shortDay(d) : v.slotDate.replace(/_/g, "/");
};

/** One conversation with a doctor, iMessage style. A message can say which visit or medicine it's about. */
export default function ChatScreen() {
  const { docId, name } = useLocalSearchParams<{ docId: string; name?: string }>();
  const router = useRouter();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [doctor, setDoctor] = useState<{ name: string; speciality: string } | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState<Topic>({});
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.MESSAGES.THREAD(docId));
      if (!data.success) throw new Error(data.message);
      setDoctor(data.doctor);
      setVisits(data.visits);
      setMessages(data.messages);
    } catch (e: any) {
      setMessages((m) => m ?? []);
      Alert.alert("Couldn't open the conversation", e?.response?.data?.message ?? e?.message ?? "Try again.");
    }
  }, [docId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.MESSAGES.THREAD(docId), { text, ...topic });
      if (!data.success) throw new Error(data.message);
      setMessages((m) => [...(m ?? []), data.message]);
      setDraft("");
      setTopic({});
    } catch (e: any) {
      Alert.alert("Not Delivered", e?.response?.data?.message ?? e?.message ?? "Try again.");
    } finally {
      setSending(false);
    }
  };

  const topicLabel = (t: Topic) => {
    const v = visits.find((x) => x._id === t.appointmentId);
    if (!v) return null;
    return t.medicineName ? `${t.medicineName} · ${visitDay(v)}` : `Visit on ${visitDay(v)}`;
  };

  /** Pick what the message is about, from an action sheet. */
  const pickTopic = () => {
    const choices: { label: string; topic: Topic }[] = [
      { label: "General message", topic: {} },
      ...visits.flatMap((v) => [
        { label: `Visit on ${visitDay(v)}`, topic: { appointmentId: v._id } },
        ...v.medicines.map((m) => ({ label: `${m} (${visitDay(v)})`, topic: { appointmentId: v._id, medicineName: m } })),
      ]),
    ];
    if (Platform.OS === "ios") {
      const labels = [...choices.map((c) => c.label), "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions(
        { title: "What is this message about?", options: labels, cancelButtonIndex: labels.length - 1 },
        (i) => choices[i] && setTopic(choices[i].topic),
      );
    } else {
      Alert.alert("What is this message about?", undefined, [...choices.slice(0, 6).map((c) => ({ text: c.label, onPress: () => setTopic(c.topic) })), { text: "Cancel", style: "cancel" }]);
    }
  };

  const about = topicLabel(topic);

  return (
    <>
      <Stack.Screen
        options={{
          title: doctor?.name ?? name ?? "",
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/book/[id]", params: { id: docId, type: "video" } })}
              accessibilityRole="button"
              accessibilityLabel="Book a video visit with this doctor"
              hitSlop={10}
            >
              <Icon ios="video" android="videocam" size={22} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.card }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
          {messages === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <ScrollView
              ref={scroll}
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={{ padding: 12, gap: 6 }}
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
            >
              {doctor ? <Text style={s.meta}>{doctor.speciality}</Text> : null}
              {messages.length === 0 ? <Text style={s.meta}>Say hello. Your doctor usually replies within a day.</Text> : null}
              {messages.map((m, i) => {
                const mine = m.sender === "patient";
                const prev = messages[i - 1];
                const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                const label = m.appointmentId ? topicLabel(m) : null;
                return (
                  <View key={m._id}>
                    {newDay ? <Text style={s.meta}>{shortDay(new Date(m.createdAt))}</Text> : null}
                    <View style={[{ maxWidth: "78%", gap: 2 }, mine ? { alignSelf: "flex-end", alignItems: "flex-end" } : { alignSelf: "flex-start" }]}>
                      {label ? <Text style={s.about}>{label}</Text> : null}
                      <View style={[s.bubble, mine ? s.mine : m.urgent ? s.urgent : s.theirs]}>
                        {m.urgent && !mine ? <Text style={[s.text, { fontWeight: "600", color: colors.red }]}>Urgent</Text> : null}
                        <Text style={[s.text, mine && { color: "#FFFFFF" }]}>{m.text}</Text>
                      </View>
                      <Text style={s.time}>{clock(new Date(m.createdAt))}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={s.composer}>
            {about ? (
              <Pressable onPress={() => setTopic({})} accessibilityRole="button" accessibilityLabel={`About ${about}. Tap to remove`} style={s.topicChip}>
                <Text style={{ fontSize: 13, color: colors.tint }}>Re: {about}</Text>
                <Icon ios="xmark.circle.fill" android="cancel" size={14} color={colors.tertiary} />
              </Pressable>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {visits.length ? (
                <Pressable onPress={pickTopic} accessibilityRole="button" accessibilityLabel="Say which visit or medicine this is about" hitSlop={6} style={s.plus}>
                  <Icon ios="plus" android="add" size={18} color={colors.secondary} />
                </Pressable>
              ) : null}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message"
                placeholderTextColor={colors.tertiary as string}
                multiline
                accessibilityLabel="Message"
                style={s.input}
              />
              <Pressable onPress={send} disabled={sending || !draft.trim()} accessibilityRole="button" accessibilityLabel="Send" hitSlop={6}>
                <Icon ios="arrow.up.circle.fill" android="send" size={32} color={sending || !draft.trim() ? colors.tertiary : colors.tint} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  meta: { textAlign: "center", fontSize: 12, color: colors.secondary, marginVertical: 8 },
  about: { fontSize: 12, color: colors.tint, marginHorizontal: 8 },
  bubble: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: colors.tint },
  theirs: { backgroundColor: colors.fill },
  urgent: { backgroundColor: colors.fill, borderWidth: 1, borderColor: colors.red },
  text: { fontSize: 17, lineHeight: 22, color: colors.label },
  time: { fontSize: 11, color: colors.tertiary, marginHorizontal: 8 },
  composer: { paddingHorizontal: 10, paddingVertical: 8, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, backgroundColor: colors.card },
  topicChip: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginLeft: 40 },
  plus: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, maxHeight: 120, minHeight: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, fontSize: 17, color: colors.label },
});
