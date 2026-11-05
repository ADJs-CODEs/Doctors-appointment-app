import { LinearGradient } from "expo-linear-gradient";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";
import { Avatar, Button, Card, colors, font, Icon, Page, Pill, RowButton, text } from "../../../components/native";
import { useAuth } from "../../../context/AuthContext";
import { useAppointments } from "../../../hooks/useAppointments";
import type { Appointment } from "../../../types";
import { API_PATHS } from "../../../utils/apiPath";
import axiosInstance from "../../../utils/axiosInstance";
import { choosePayment, joinVideoVisit, walletSpendableCents } from "../../../utils/payment";
import { activeMedicines, clock, isOpen, sameDay, shortDay, slotStart, titleCase, unpaidHold } from "../../../utils/schedule";

type Extras = { walletCents: number | null; watching: number; watchers: number; requests: number; invite: { _id: string; condition: string } | null };

/** Home: who's next, what to take, and the way into everything Clarity does. */
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { appointments, refreshing, refresh, takeDose, saving, reload } = useAppointments();
  const [extras, setExtras] = useState<Extras>({ walletCents: null, watching: 0, watchers: 0, requests: 0, invite: null });

  // the cards' numbers: wallet balance, care circle and a Wish Well invitation, if there is one
  const loadExtras = useCallback(async () => {
    const get = (path: string) => axiosInstance.get(path).then((r) => r.data).catch(() => null);
    const [wallet, watching, watchers, requests, invite] = await Promise.all([
      get(API_PATHS.WALLET.OVERVIEW),
      get(API_PATHS.CONNECTIONS.WATCHING_OVER),
      get(API_PATHS.CONNECTIONS.MY_WATCHERS),
      get(API_PATHS.CONNECTIONS.MY_REQUESTS),
      get(API_PATHS.WISH_WELL.PENDING),
    ]);
    setExtras({
      walletCents: wallet?.success ? (wallet.fundCents ?? 0) + (wallet.coins ?? 0) : null,
      watching: watching?.watching?.length ?? 0,
      watchers: watchers?.watchers?.length ?? 0,
      requests: requests?.requests?.filter((r: any) => r.status === "pending").length ?? 0,
      invite: invite?.pending?.[0] ?? null,
    });
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadExtras();
    }, [loadExtras]),
  );

  const now = new Date();
  const list = appointments ?? [];
  const meds = activeMedicines(list, now).sort((a, b) => a.due.getTime() - b.due.getTime());
  const takenToday = meds.reduce((n, m) => n + m.taken.length, 0);
  const dueNow = meds.filter((m) => m.due <= now);
  const nextDose = meds.find((m) => m.due > now);
  const hold = list.find((a) => unpaidHold(a));
  const next = list
    .filter((a) => isOpen(a) && a.payment)
    .map((a) => ({ a, at: slotStart(a) }))
    .filter((x): x is { a: Appointment; at: Date } => !!x.at && x.at.getTime() > now.getTime() - 60 * 60_000)
    .sort((x, y) => x.at.getTime() - y.at.getTime())[0];

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = titleCase(user?.name?.split(" ")[0] ?? "");

  const answerInvite = async (accept: boolean) => {
    if (!extras.invite) return;
    try {
      const { data } = await axiosInstance.post(API_PATHS.WISH_WELL.CONSENT, { entryId: extras.invite._id, accept });
      Alert.alert(accept ? "You're on the Wish Well" : "No problem", data.message);
    } catch (e: any) {
      Alert.alert("Couldn't save that", e?.response?.data?.message ?? "Try again.");
    }
    loadExtras();
  };

  const pay = async (a: Appointment) => {
    await choosePayment(a._id, a.amount, "$", await walletSpendableCents());
    reload();
  };

  return (
    <Page
      subtitle={now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
      title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
      right={
        <Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Your profile">
          <Avatar name={user?.name ?? "?"} image={user?.image} size={42} round />
        </Pressable>
      }
      loading={!appointments}
      refreshing={refreshing}
      onRefresh={() => {
        refresh();
        loadExtras();
      }}
    >
      {/* what's next, big */}
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <LinearGradient colors={["#14365F", "#0B2545"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <View style={st.heroGlow} />
          {hold ? (
            <>
              <Text style={st.heroEyebrow}>Waiting for payment</Text>
              <Text style={st.heroTitle}>{hold.docData?.name}</Text>
              <Text style={st.heroLine}>
                {shortDay(slotStart(hold) ?? now)}, {hold.slotTime} · held for{" "}
                {Math.max(1, Math.round((new Date(hold.holdExpiresAt!).getTime() - now.getTime()) / 60_000))} more min
              </Text>
              <Button label={`Pay $${hold.amount}`} tone="teal" onPress={() => pay(hold)} style={{ marginTop: 16 }} />
            </>
          ) : next ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={st.heroEyebrow}>{sameDay(next.at, now) ? "Today" : shortDay(next.at)} · {clock(next.at)}</Text>
                <View style={st.heroChip}>
                  <Icon ios={next.a.kind === "video" ? "video.fill" : "cross.case.fill"} size={12} color="#8FE3E1" />
                  <Text style={st.heroChipText}>{next.a.kind === "video" ? "Video visit" : "At the clinic"}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }}>
                <Avatar name={next.a.docData?.name ?? ""} image={next.a.docData?.image} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={st.heroTitle}>{next.a.docData?.name}</Text>
                  <Text style={st.heroLine}>{next.a.docData?.speciality}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                {next.a.kind === "video" ? (
                  <Button label="Join call" tone="video" icon="video.fill" onPress={() => joinVideoVisit(API_PATHS.USER.VIDEO_JOIN(next.a._id))} style={{ flex: 1 }} />
                ) : (
                  <Button label="See visit" tone="teal" onPress={() => router.navigate("/visits")} style={{ flex: 1 }} />
                )}
                <Button
                  label="Message"
                  tone="light"
                  onPress={() => router.push({ pathname: "/messages/[docId]", params: { docId: next.a.docId, name: next.a.docData?.name } })}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={st.heroEyebrow}>No visits booked</Text>
              <Text style={st.heroTitle}>See a doctor, at the clinic or by video</Text>
              <Button label="Book a visit" tone="teal" icon="plus" onPress={() => router.push("/doctors")} style={{ marginTop: 16 }} />
            </>
          )}
        </LinearGradient>
      </View>

      {/* Wish Well invitation */}
      {extras.invite ? (
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Card tone="video">
            <Text style={text.h2}>Your doctor put you forward for the Wish Well</Text>
            <Text style={[text.body, { marginTop: 4 }]}>
              If you say yes, the community can send you love and support. Nothing about you is shown until you accept.
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Button label="Yes, add me" tone="video" onPress={() => answerInvite(true)} style={{ flex: 1 }} />
              <Button label="No thanks" tone="light" onPress={() => answerInvite(false)} />
            </View>
          </Card>
        </View>
      ) : null}

      {/* medicines today */}
      <View style={{ marginHorizontal: 16, marginTop: 12 }}>
        <Pressable onPress={() => router.navigate("/meds")} accessibilityRole="button" accessibilityLabel="Your medicines">
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={text.h2}>Medicines today</Text>
              <Text style={[text.small, text.num]}>{takenToday} taken</Text>
            </View>
            {meds.length === 0 ? (
              <Text style={[text.body, { marginTop: 6 }]}>Nothing to take. Medicines your doctor prescribes show up here with reminders.</Text>
            ) : (
              <View style={{ marginTop: 10, gap: 10 }}>
                {[...dueNow.slice(0, 2), ...(nextDose && dueNow.length < 2 ? [nextDose] : [])].map((m) => {
                  const due = m.due <= now;
                  const key = `${m.appointment._id}-${m.med.name}`;
                  return (
                    <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={[st.doseDot, { backgroundColor: m.late ? colors.warnSoft : due ? colors.brandSoft : colors.fill }]}>
                        <Icon ios="pills.fill" android="pill" size={16} color={m.late ? colors.warn : due ? colors.tint : colors.gray} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.doseName}>{m.med.name}</Text>
                        <Text style={[text.small, m.late && { color: colors.warn }]}>
                          {m.late ? `Late · was due ${sameDay(m.due, now) ? "at" : `${shortDay(m.due)},`} ${clock(m.due)}` : due ? "Due now" : `Next at ${clock(m.due)}`}
                        </Text>
                      </View>
                      <RowButton label="Take" filled={due} busy={saving === key} onPress={() => takeDose(m.appointment._id, m.med.name, !due)} />
                    </View>
                  );
                })}
                {meds.length > 3 ? <Text style={[text.small, { color: colors.tint, fontFamily: font.bold }]}>See all {meds.length} medicines</Text> : null}
              </View>
            )}
          </Card>
        </Pressable>
      </View>

      {/* everything Clarity does */}
      <View style={st.grid}>
        <Tile
          dark
          icon="sparkles"
          title="Wish Well"
          line="Send love to patients who are fighting"
          onPress={() => router.navigate("/wishwell" as Href)}
        />
        <Tile
          icon="person.2.fill"
          tone={colors.video}
          title="Care circle"
          line={
            extras.requests
              ? `${extras.requests} new request${extras.requests === 1 ? "" : "s"}`
              : `${extras.watchers} watching over you · you watch ${extras.watching}`
          }
          badge={extras.requests > 0}
          onPress={() => router.push("/watching")}
        />
        <Tile icon="cross.case.fill" tone={colors.tint} title="Pharmacy" line="Medicines delivered near you" onPress={() => router.push("/pharmacy")} />
        <Tile
          icon="wallet.bifold.fill"
          tone={colors.orange}
          title="Wallet"
          line={extras.walletCents === null ? "Coins and care fund" : `$${(extras.walletCents / 100).toFixed(2)} available`}
          onPress={() => router.push("/wallet" as Href)}
        />
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 12 }}>
        <Pressable onPress={() => router.push("/doctors")} accessibilityRole="button">
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[st.doseDot, { backgroundColor: colors.brandSoft, width: 44, height: 44 }]}>
              <Icon ios="stethoscope" android="stethoscope" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={text.h2}>Find a doctor</Text>
              <Text style={text.small}>Book a clinic visit or a video call</Text>
            </View>
            <Pill label="Book" />
          </Card>
        </Pressable>
      </View>
    </Page>
  );
}

function Tile({ icon, title, line, onPress, tone = colors.tint, dark, badge }: { icon: SFSymbol; title: string; line: string; onPress: () => void; tone?: string; dark?: boolean; badge?: boolean }) {
  const inner = (
    <>
      <View style={[st.tileIcon, { backgroundColor: dark ? "rgba(255,255,255,0.12)" : `${tone}1A` }]}>
        <Icon ios={icon} size={20} color={dark ? "#F9D97A" : tone} />
        {badge ? <View style={st.badge} /> : null}
      </View>
      <Text style={[st.tileTitle, dark && { color: "#FFFFFF" }]}>{title}</Text>
      <Text style={[st.tileLine, dark && { color: "rgba(255,255,255,0.72)" }]} numberOfLines={2}>
        {line}
      </Text>
    </>
  );
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${line}`} style={({ pressed }) => [st.tileWrap, pressed && { opacity: 0.85 }]}>
      {dark ? (
        <LinearGradient colors={["#1B2F5B", "#0A1530"]} style={st.tile}>
          {[18, 64, 120, 150].map((x, i) => (
            <View key={i} style={[st.star, { left: x, top: 14 + ((i * 23) % 50), opacity: 0.35 + (i % 3) * 0.2 }]} />
          ))}
          {inner}
        </LinearGradient>
      ) : (
        <View style={[st.tile, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }]}>{inner}</View>
      )}
    </Pressable>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: 26, padding: 20, overflow: "hidden" },
  heroGlow: { position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(14,165,164,0.28)" },
  heroEyebrow: { fontFamily: font.bold, fontSize: 13, color: "#8FE3E1" },
  heroTitle: { fontFamily: font.heavy, fontSize: 20, color: "#FFFFFF", letterSpacing: -0.3, marginTop: 4 },
  heroLine: { fontFamily: font.regular, fontSize: 14, color: "rgba(255,255,255,0.72)", marginTop: 2 },
  heroChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  heroChipText: { fontFamily: font.bold, fontSize: 12, color: "#FFFFFF" },
  doseDot: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  doseName: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: 16, marginTop: 12 },
  tileWrap: { width: "48.5%" },
  tile: { borderRadius: 22, padding: 14, minHeight: 132, overflow: "hidden" },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileTitle: { fontFamily: font.heavy, fontSize: 16, color: colors.ink },
  tileLine: { fontFamily: font.regular, fontSize: 13, color: colors.ink3, marginTop: 2, lineHeight: 17 },
  star: { position: "absolute", width: 3, height: 3, borderRadius: 2, backgroundColor: "#FFFFFF" },
  badge: { position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rose, borderWidth: 2, borderColor: "#FFFFFF" },
});
