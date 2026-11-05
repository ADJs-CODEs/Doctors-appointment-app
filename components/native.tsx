import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import { Children, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type ColorValue, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

/**
 * Clarity's design kit for the phone, the same brand as the website: navy ink, teal accent,
 * violet for video, Manrope for words and IBM Plex Mono for numbers, white rounded cards on a
 * soft canvas, glossy navy buttons. Every screen is built from these.
 */

export const colors = {
  background: "#F3F6F5",
  card: "#FFFFFF",
  ink: "#0B2545",
  ink2: "#3B4A60",
  ink3: "#52637A",
  label: "#0B2545",
  secondary: "#52637A",
  tertiary: "#9AA8B6",
  line: "#DCE4E2",
  separator: "#E8EEEC",
  fill: "#EEF3F2",
  tint: "#0B7C7B",
  brand: "#0EA5A4",
  brandSoft: "#E3F3F1",
  video: "#6D28D9",
  videoSoft: "#EFE9FC",
  warn: "#A35208",
  warnSoft: "#FDF3E4",
  orange: "#D97706",
  red: "#B91C1C",
  redSoft: "#FEF2F2",
  purple: "#6D28D9",
  blue: "#2563EB",
  green: "#0B7C7B",
  gray: "#7D8B9C",
  rose: "#E11D48",
  roseSoft: "#FFE4E6",
};

export const font = {
  regular: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  heavy: "Manrope_800ExtraBold",
  num: "IBMPlexMono_500Medium",
};

/** An SF Symbol on iPhone, the matching Material symbol on Android. */
export function Icon({ ios, android, size = 20, color = colors.tint }: { ios: SFSymbol; android?: string; size?: number; color?: ColorValue }) {
  return <SymbolView name={{ ios, android: android as any }} size={size} tintColor={color} type="monochrome" />;
}

/** A tab or screen: Clarity's own header (title, line under it, buttons on the right) over a scrolling page. */
export function Page({
  title,
  subtitle,
  right,
  top,
  children,
  refreshing,
  onRefresh,
  loading,
  edges = ["top"],
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** something full-width above the title (e.g. the Wish Well sky) */
  top?: ReactNode;
  children?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  edges?: ("top" | "bottom")[];
}) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.tint} /> : undefined}
      >
        {top}
        {title ? (
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              {subtitle ? <Text style={s.eyebrow}>{subtitle}</Text> : null}
              <Text style={s.h1}>{title}</Text>
            </View>
            {right}
          </View>
        ) : null}
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} /> : children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** A titled group: bold heading, then a white card holding rows separated by hairlines. */
export function Section({ title, action, footer, children }: { title?: string; action?: ReactNode; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  if (!rows.length) return null;
  return (
    <View style={s.section}>
      {title ? (
        <View style={s.sectionHead}>
          <Text style={s.h2}>{title}</Text>
          {action}
        </View>
      ) : null}
      <View style={s.card}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={s.separator} /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? <Text style={s.footer}>{footer}</Text> : null}
    </View>
  );
}

/** A plain white card, for anything that isn't a list. */
export function Card({ children, style, tone }: { children: ReactNode; style?: ViewStyle; tone?: "warn" | "brand" | "video" }) {
  const toneStyle =
    tone === "warn"
      ? { backgroundColor: colors.warnSoft, borderColor: "#F1D9B5" }
      : tone === "brand"
        ? { backgroundColor: colors.brandSoft, borderColor: "#BFE6E2" }
        : tone === "video"
          ? { backgroundColor: colors.videoSoft, borderColor: "#DDD0FA" }
          : null;
  return <View style={[s.card, s.cardPad, toneStyle, style]}>{children}</View>;
}

type RowProps = {
  title: string;
  subtitle?: string;
  subtitleColor?: ColorValue;
  icon?: { ios: SFSymbol; android?: string; bg: ColorValue; fg?: ColorValue };
  leading?: ReactNode;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
};

/** A list row: soft icon tile, title, a line under it, and something on the right. */
export function Row({ title, subtitle, subtitleColor, icon, leading, value, trailing, onPress, chevron, destructive, accessibilityLabel }: RowProps) {
  const body = (
    <View style={s.row}>
      {icon ? (
        <View style={[s.tile, { backgroundColor: tileBg(icon.bg) }]}>
          <Icon ios={icon.ios} android={icon.android} size={18} color={icon.fg ?? icon.bg} />
        </View>
      ) : null}
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.title, destructive && { color: colors.red }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[s.subtitle, subtitleColor ? { color: subtitleColor } : null]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={s.value}>{value}</Text> : null}
      {trailing}
      {chevron ? <Icon ios="chevron.right" android="chevron_right" size={13} color={colors.tertiary} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={({ pressed }) => pressed && { backgroundColor: colors.fill }}>
      {body}
    </Pressable>
  );
}

/** the icon colour, faded, as its tile background (the website's soft tiles) */
function tileBg(c: ColorValue) {
  const map: Record<string, string> = {
    [colors.tint]: colors.brandSoft,
    [colors.brand]: colors.brandSoft,
    [colors.video]: colors.videoSoft,
    [colors.orange]: colors.warnSoft,
    [colors.warn]: colors.warnSoft,
    [colors.red]: colors.redSoft,
    [colors.rose]: colors.roseSoft,
    [colors.blue]: "#E6EEFD",
    [colors.gray]: colors.fill,
    [colors.ink]: "#E6ECF5",
  };
  return map[c as string] ?? colors.fill;
}

/** The small button on the right of a row ("Take", "Pay", "Join"). */
export function RowButton({ label, onPress, color = colors.ink, filled, busy }: { label: string; onPress: () => void; color?: ColorValue; filled?: boolean; busy?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [s.small, filled ? { backgroundColor: color, borderColor: color } : { borderColor: color }, pressed && { opacity: 0.7 }]}
    >
      {busy ? <ActivityIndicator size="small" color={filled ? "#fff" : (color as string)} /> : <Text style={[s.smallText, { color: filled ? "#FFFFFF" : color }]}>{label}</Text>}
    </Pressable>
  );
}

/** The website's glossy navy (or teal / violet) button. */
export function Button({ label, onPress, tone = "ink", busy, icon, style }: { label: string; onPress: () => void; tone?: "ink" | "teal" | "video" | "light"; busy?: boolean; icon?: SFSymbol; style?: ViewStyle }) {
  const stops: Record<string, [string, string]> = {
    ink: ["#1A3A66", "#0B2545"],
    teal: ["#14B8B6", "#0B7C7B"],
    video: ["#8B5CF6", "#6D28D9"],
    light: ["#FFFFFF", "#F1F5F4"],
  };
  const fg = tone === "light" ? colors.ink : "#FFFFFF";
  return (
    <Pressable onPress={onPress} disabled={busy} accessibilityRole="button" style={({ pressed }) => [{ borderRadius: 14, overflow: "hidden" }, pressed && { opacity: 0.85 }, style]}>
      <LinearGradient colors={stops[tone]} style={s.button}>
        {busy ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <Icon ios={icon} size={17} color={fg} /> : null}
            <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

/** A small rounded label: Paid, Video, Late… */
export function Pill({ label, tone = "brand" }: { label: string; tone?: "brand" | "warn" | "video" | "plain" | "red" }) {
  const look = {
    brand: [colors.brandSoft, colors.tint],
    warn: [colors.warnSoft, colors.warn],
    video: [colors.videoSoft, colors.video],
    plain: [colors.fill, colors.ink2],
    red: [colors.redSoft, colors.red],
  }[tone];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: look[0], borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: font.bold, fontSize: 12, color: look[1] }}>{label}</Text>
    </View>
  );
}

/** A photo, or initials in a soft square. */
export function Avatar({ name, image, size = 44, round }: { name: string; image?: string; size?: number; round?: boolean }) {
  const radius = round ? size / 2 : size / 3.2;
  if (image && !image.includes("data:image/png;base64,iVBOR")) {
    return <Image source={{ uri: image }} style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.fill }} contentFit="cover" />;
  }
  const letters = name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#E6ECF5", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: font.heavy, color: colors.ink, fontSize: size * 0.34 }}>{letters || "?"}</Text>
    </View>
  );
}

/** Round back button for screens that open on top of the tabs. */
export function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}
    >
      <Icon ios="xmark" android="close" size={15} color={colors.ink} />
    </Pressable>
  );
}

export function Empty({ icon, title, message, action }: { icon: SFSymbol; title: string; message: string; action?: ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Card style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
        <View style={[s.tile, { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brandSoft }]}>
          <Icon ios={icon} size={24} />
        </View>
        <Text style={[s.h2, { textAlign: "center" }]}>{title}</Text>
        <Text style={[s.subtitle, { textAlign: "center" }]}>{message}</Text>
        {action ? <View style={{ marginTop: 6 }}>{action}</View> : null}
      </Card>
    </View>
  );
}

export const text = {
  h1: { fontFamily: font.heavy, fontSize: 28, color: colors.ink, letterSpacing: -0.6 },
  h2: { fontFamily: font.heavy, fontSize: 17, color: colors.ink },
  body: { fontFamily: font.regular, fontSize: 15, color: colors.ink2, lineHeight: 21 },
  small: { fontFamily: font.regular, fontSize: 13, color: colors.ink3 },
  num: { fontFamily: font.num },
};

/** For screens that keep a native top bar (a chat, a detail): Clarity colours on it. */
export const nativeHeader = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
};
export const detailHeader = {
  headerShown: true,
  headerTintColor: colors.tint,
  headerTitleStyle: { fontFamily: font.heavy, color: colors.ink },
  headerStyle: { backgroundColor: colors.card },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal" as const,
};

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  eyebrow: { fontFamily: font.semibold, fontSize: 14, color: colors.ink3, marginBottom: 2 },
  h1: text.h1,
  h2: text.h2,
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  cardPad: { padding: 16 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 66 },
  footer: { fontFamily: font.regular, fontSize: 13, color: colors.ink3, marginHorizontal: 8, marginTop: 8, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 12 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink },
  subtitle: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink3, marginTop: 2, lineHeight: 18 },
  value: { fontFamily: font.num, fontSize: 14, color: colors.ink3 },
  small: { minWidth: 62, height: 34, borderRadius: 11, borderWidth: 1.5, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  smallText: { fontFamily: font.bold, fontSize: 14 },
  button: { height: 50, paddingHorizontal: 20, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: font.heavy, fontSize: 15.5 },
});
