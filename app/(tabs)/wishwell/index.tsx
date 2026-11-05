import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, colors, Empty, font, Page, text } from "../../../components/native";
import { API_PATHS } from "../../../utils/apiPath";
import axiosInstance from "../../../utils/axiosInstance";

type Entry = {
  _id: string;
  patientName: string;
  patientImage?: string;
  condition: string;
  story: string;
  status: "critical" | "recovered" | "passed";
  totalEmojis: number;
  emojiCounts: Record<"heart" | "flower" | "clap" | "star" | "prayer", number>;
};

const WISHES = [
  { emoji: "❤️", key: "heart", label: "Love" },
  { emoji: "🌸", key: "flower", label: "Flowers" },
  { emoji: "👏", key: "clap", label: "Cheer" },
  { emoji: "⭐", key: "star", label: "Strength" },
  { emoji: "🙏", key: "prayer", label: "Prayer" },
] as const;

/**
 * The Wish Well: people our doctors put forward (and who said yes), and the community sending them
 * love. Kept calm on purpose: it's about people who are seriously ill.
 */
export default function WishWellScreen() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.WISH_WELL.ALL);
      setEntries(data.success ? data.entries : []);
    } catch {
      setEntries((e) => e ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const fighting = (entries ?? []).filter((e) => e.status === "critical");
  const recovered = (entries ?? []).filter((e) => e.status === "recovered");
  const total = (entries ?? []).reduce((n, e) => n + (e.totalEmojis || 0), 0);

  const sky = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: `${(i * 37) % 100}%` as const,
        top: (i * 53) % 170,
        size: i % 7 === 0 ? 3 : 2,
        opacity: 0.25 + ((i * 13) % 10) / 16,
      })),
    [],
  );

  return (
    <Page
      edges={[]}
      loading={!entries}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      top={
        <LinearGradient colors={["#081530", "#0F2650", "#163A66"]} style={st.sky}>
          {sky.map((s, i) => (
            <View key={i} style={[st.star, { left: s.left, top: 60 + s.top, width: s.size, height: s.size, opacity: s.opacity }]} />
          ))}
          <View style={st.moon} />
          <Text style={st.skyEyebrow}>Community</Text>
          <Text style={st.skyTitle}>Wish Well</Text>
          <Text style={st.skyLine}>
            Every light is a wish someone sent. <Text style={{ fontFamily: font.num }}>{total.toLocaleString()}</Text> so far.
          </Text>
        </LinearGradient>
      }
    >
      {entries && !fighting.length && !recovered.length ? (
        <Empty icon="sparkles" title="No one on the Wish Well right now" message="When our doctors put a patient forward and they say yes, you can send them love here." />
      ) : null}

      {fighting.length ? <Text style={st.heading}>Sending love to</Text> : null}
      {fighting.map((e) => (
        <Person key={e._id} entry={e} onSent={load} />
      ))}

      {recovered.length ? <Text style={st.heading}>Recovered</Text> : null}
      {recovered.map((e) => (
        <Person key={e._id} entry={e} onSent={load} recovered />
      ))}
    </Page>
  );
}

function Person({ entry, onSent, recovered }: { entry: Entry; onSent: () => void; recovered?: boolean }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(entry.totalEmojis || 0);
  const [floats, setFloats] = useState<{ id: number; emoji: string; anim: Animated.Value; x: number }[]>([]);
  const seq = useRef(0);
  const long = entry.story.length > 220;

  const send = async (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount((c) => c + 1);
    // the sent wish floats up from the button
    const anim = new Animated.Value(0);
    const id = ++seq.current;
    setFloats((f) => [...f, { id, emoji, anim, x: Math.random() * 40 - 20 }]);
    Animated.timing(anim, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() =>
      setFloats((f) => f.filter((x) => x.id !== id)),
    );
    try {
      const { data } = await axiosInstance.post(API_PATHS.WISH_WELL.SEND, { entryId: entry._id, emoji });
      if (!data.success) throw new Error(data.message);
    } catch (e: any) {
      setCount((c) => c - 1);
      Alert.alert("Not sent", e?.response?.data?.message ?? e?.message ?? "Try again.");
      onSent();
    }
  };

  return (
    <View style={st.card}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Avatar name={entry.patientName} image={entry.patientImage} size={52} round />
        <View style={{ flex: 1 }}>
          <Text style={text.h2}>{entry.patientName}</Text>
          <Text style={[text.small, { marginTop: 2 }]}>{recovered ? "Recovered" : entry.condition}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={st.count}>{count.toLocaleString()}</Text>
          <Text style={text.small}>wishes</Text>
        </View>
      </View>

      <Text style={[text.body, { marginTop: 12 }]} numberOfLines={open || !long ? undefined : 4}>
        {entry.story}
      </Text>
      {long ? (
        <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" hitSlop={8}>
          <Text style={st.more}>{open ? "Show less" : "Read more"}</Text>
        </Pressable>
      ) : null}

      <View style={st.wishes}>
        {floats.map((f) => (
          <Animated.Text
            key={f.id}
            pointerEvents="none"
            style={[
              st.float,
              {
                transform: [
                  { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -110] }) },
                  { translateX: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, f.x] }) },
                  { scale: f.anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.2, 1] }) },
                ],
                opacity: f.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
              },
            ]}
          >
            {f.emoji}
          </Animated.Text>
        ))}
        {(recovered ? [{ emoji: "🎉", key: "party", label: "Congratulate" }] : WISHES).map((w) => (
          <Pressable
            key={w.key}
            onPress={() => send(w.emoji)}
            accessibilityRole="button"
            accessibilityLabel={`Send ${w.label.toLowerCase()} to ${entry.patientName}`}
            style={({ pressed }) => [st.wish, recovered && { flex: 0, paddingHorizontal: 18 }, pressed && { transform: [{ scale: 0.94 }], backgroundColor: colors.brandSoft }]}
          >
            <Text style={{ fontSize: 22 }}>{w.emoji}</Text>
            <Text style={st.wishLabel}>{w.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  sky: { paddingTop: 70, paddingBottom: 28, paddingHorizontal: 20, overflow: "hidden" },
  star: { position: "absolute", borderRadius: 2, backgroundColor: "#FFFFFF" },
  moon: { position: "absolute", right: 28, top: 78, width: 44, height: 44, borderRadius: 22, backgroundColor: "#F9E7B0", opacity: 0.9 },
  skyEyebrow: { fontFamily: font.bold, fontSize: 13, color: "#8FE3E1" },
  skyTitle: { fontFamily: font.heavy, fontSize: 34, color: "#FFFFFF", letterSpacing: -0.8, marginTop: 2 },
  skyLine: { fontFamily: font.regular, fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 6, maxWidth: 280 },
  heading: { ...text.h2, marginHorizontal: 20, marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  count: { fontFamily: font.num, fontSize: 20, color: colors.ink },
  more: { fontFamily: font.bold, fontSize: 14, color: colors.tint, marginTop: 6 },
  wishes: { flexDirection: "row", gap: 6, marginTop: 14 },
  wish: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.fill },
  wishLabel: { fontFamily: font.semibold, fontSize: 11, color: colors.ink3 },
  float: { position: "absolute", left: "45%", bottom: 30, fontSize: 30, zIndex: 2 },
});
