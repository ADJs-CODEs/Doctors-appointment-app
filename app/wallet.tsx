import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackButton, colors, Empty, font, Page, Row, Section } from "../components/native";
import { API_PATHS } from "../utils/apiPath";
import axiosInstance from "../utils/axiosInstance";

type Tx = {
  _id: string;
  kind: string;
  coins: number;
  cents: number;
  counterpartyName?: string;
  note?: string;
  createdAt: string;
};
type Wallet = { coins: number; fundCents: number; fundLifetimeCents: number; hasCareFund: boolean; transactions: Tx[]; pendingPayout?: { cents: number } | null };

const money = (cents: number) => `$${(Math.abs(cents) / 100).toFixed(2)}`;

/** What each line in the history means, in words, with its icon. */
const describe = (t: Tx) => {
  const who = t.counterpartyName ? ` ${t.counterpartyName}` : "";
  switch (t.kind) {
    case "topup":
      return { title: "Bought coins", icon: "plus.circle.fill" as const, color: colors.tint };
    case "gift_sent":
      return { title: `Gift to${who || " the Wish Well"}`, icon: "gift.fill" as const, color: colors.video };
    case "gift_received":
      return { title: `Gift from${who || " the community"}`, icon: "gift.fill" as const, color: colors.rose };
    case "appointment_payment":
      return { title: "Paid for a visit", icon: "calendar" as const, color: colors.ink };
    case "appointment_refund":
      return { title: "Visit refund", icon: "arrow.uturn.backward.circle.fill" as const, color: colors.tint };
    case "shop_payment":
      return { title: "Pharmacy order", icon: "bag.fill" as const, color: colors.ink };
    case "shop_refund":
      return { title: "Pharmacy refund", icon: "arrow.uturn.backward.circle.fill" as const, color: colors.tint };
    case "payout_requested":
      return { title: "Withdrawal from care fund", icon: "building.columns.fill" as const, color: colors.orange };
    case "payout_returned":
      return { title: "Withdrawal returned", icon: "arrow.uturn.backward.circle.fill" as const, color: colors.tint };
    default:
      return { title: t.note ?? "Wallet", icon: "circle.fill" as const, color: colors.gray };
  }
};

/** Coins (for Wish Well gifts and visits) and the care fund (gifts others sent you). */
export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.WALLET.OVERVIEW);
      if (data.success) setWallet(data);
    } catch {
      setWallet((w) => w ?? { coins: 0, fundCents: 0, fundLifetimeCents: 0, hasCareFund: false, transactions: [] });
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = (wallet?.coins ?? 0) + (wallet?.fundCents ?? 0);

  return (
    <Page
      title="Wallet"
      subtitle="Coins and care fund"
      right={<BackButton />}
      loading={!wallet}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <LinearGradient colors={["#14365F", "#0B2545"]} style={st.hero}>
          <View style={st.glow} />
          <Text style={st.eyebrow}>You can spend</Text>
          <Text style={st.big}>{money(total)}</Text>
          <Text style={st.line}>On visits, pharmacy orders and Wish Well gifts. The care fund is used first.</Text>
          <View style={st.split}>
            <View style={{ flex: 1 }}>
              <Text style={st.splitLabel}>Coins</Text>
              <Text style={st.splitValue}>{(wallet?.coins ?? 0).toLocaleString()}</Text>
            </View>
            <View style={st.splitLine} />
            <View style={{ flex: 1 }}>
              <Text style={st.splitLabel}>Care fund</Text>
              <Text style={st.splitValue}>{money(wallet?.fundCents ?? 0)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {wallet?.hasCareFund ? (
        <Section
          title="Your care fund"
          footer="Gifts the community sends you on the Wish Well. You can withdraw it to your bank on the Clarity website."
        >
          <Row icon={{ ios: "heart.fill", android: "favorite", bg: colors.rose }} title="Raised so far" value={money(wallet.fundLifetimeCents)} />
          {wallet.pendingPayout ? (
            <Row icon={{ ios: "building.columns.fill", android: "account_balance", bg: colors.orange }} title="Withdrawal on its way" value={money(wallet.pendingPayout.cents)} />
          ) : null}
        </Section>
      ) : null}

      <Section title="History" footer="1 coin = 1 cent. Coins can be spent here but not withdrawn.">
        {(wallet?.transactions ?? []).slice(0, 30).map((t) => {
          const d = describe(t);
          const amount = t.cents ? `${t.cents > 0 ? "+" : "−"}${money(t.cents)}` : `${t.coins > 0 ? "+" : "−"}${Math.abs(t.coins).toLocaleString()} coins`;
          return (
            <Row
              key={t._id}
              icon={{ ios: d.icon, bg: d.color }}
              title={d.title}
              subtitle={new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              value={amount}
            />
          );
        })}
      </Section>
      {wallet && !wallet.transactions.length ? <Empty icon="wallet.bifold" title="Nothing here yet" message="Coins you buy, gifts and refunds show up here." /> : null}
    </Page>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: 26, padding: 20, overflow: "hidden" },
  glow: { position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(14,165,164,0.28)" },
  eyebrow: { fontFamily: font.bold, fontSize: 13, color: "#8FE3E1" },
  big: { fontFamily: font.num, fontSize: 40, color: "#FFFFFF", marginTop: 6 },
  line: { fontFamily: font.regular, fontSize: 14, color: "rgba(255,255,255,0.72)", marginTop: 4 },
  split: { flexDirection: "row", marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.2)" },
  splitLine: { width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 14 },
  splitLabel: { fontFamily: font.semibold, fontSize: 13, color: "rgba(255,255,255,0.65)" },
  splitValue: { fontFamily: font.num, fontSize: 18, color: "#FFFFFF", marginTop: 2 },
});
