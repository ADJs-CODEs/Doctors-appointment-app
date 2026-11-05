import { Image } from "expo-image";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Platform, Text, TextInput, View } from "react-native";
import { BackButton, colors, Empty, font, Icon, Page, Row, RowButton, Section } from "../components/native";
import { API_PATHS } from "../utils/apiPath";
import axiosInstance from "../utils/axiosInstance";

type Product = {
  _id: string;
  name: string;
  strength?: string;
  packSize?: string;
  priceCents: number;
  image?: string;
  inStock: boolean;
  requiresPrescription: boolean;
  prescribedForYou: boolean;
  pharmacy: { _id: string; name: string; distanceKm: number };
};
type Category = { id: string; label: string };
type Origin = { lat: number; lng: number };

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Medicines from approved pharmacies that deliver to you (your location, or the home address in
 * your profile), the same shop as the website. Anything a doctor prescribed you comes first.
 */
export default function PharmacyScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.post(API_PATHS.SHOP.BROWSE, { q: search || undefined, category: category?.id, origin: origin ?? undefined });
      if (!data.success) throw new Error(data.message);
      setProducts(data.products);
      setCategories(data.categories ?? []);
      setProblem(null);
    } catch (e: any) {
      setProducts([]);
      setProblem(e?.response?.data?.message ?? e?.message ?? "Couldn't load the shop");
    } finally {
      setRefreshing(false);
    }
  }, [search, category, origin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // search once typing pauses
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // the location is only sent to find nearby pharmacies; the server doesn't keep it
  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location is off", "Allow location for Clarity in Settings, or add a home address in your profile.");
        return;
      }
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOrigin({ lat: here.coords.latitude, lng: here.coords.longitude });
    } catch {
      Alert.alert("Couldn't find you", "Try again in a moment.");
    } finally {
      setLocating(false);
    }
  };

  const pickCategory = () => {
    const options = [{ id: "", label: "All Sections" }, ...categories];
    const set = (c: Category) => setCategory(c.id ? c : null);
    if (Platform.OS === "ios") {
      const labels = [...options.map((c) => c.label), "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions({ options: labels, cancelButtonIndex: labels.length - 1 }, (i) => options[i] && set(options[i]));
    } else {
      Alert.alert("Section", undefined, [...options.slice(0, 8).map((c) => ({ text: c.label, onPress: () => set(c) })), { text: "Cancel", style: "cancel" }]);
    }
  };

  const prescribed = (products ?? []).filter((p) => p.prescribedForYou);
  const rest = (products ?? []).filter((p) => !p.prescribedForYou);

  const productRow = (p: Product) => (
    <Row
      key={p._id}
      leading={
        <View style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" }}>
          {p.image ? <Image source={{ uri: p.image }} style={{ width: 44, height: 44 }} contentFit="cover" accessibilityIgnoresInvertColors /> : null}
        </View>
      }
      title={`${p.name}${p.strength ? `, ${p.strength}` : ""}`}
      subtitle={`${p.pharmacy.name} · ${p.pharmacy.distanceKm} km${p.requiresPrescription ? " · Prescription" : ""}${p.inStock ? "" : " · Out of stock"}`}
      trailing={<Text style={{ fontSize: 17, color: p.inStock ? colors.label : colors.tertiary, fontVariant: ["tabular-nums"] }}>{money(p.priceCents)}</Text>}
    />
  );

  return (
    <>
      <Page
        title="Pharmacy"
        subtitle="Delivered from pharmacies near you"
        right={<BackButton />}
        loading={!products}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
      >
        <View style={{ marginHorizontal: 16, marginTop: 14, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 }}>
          <Icon ios="magnifyingglass" android="search" size={17} color={colors.ink3} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search medicines and health items"
            placeholderTextColor={colors.tertiary}
            accessibilityLabel="Search medicines"
            returnKeyType="search"
            style={{ flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.ink }}
          />
        </View>

        <Section footer={origin ? "Showing pharmacies that deliver to where you are now." : "Showing pharmacies that deliver to the home address in your profile."}>
          <Row
            icon={{ ios: "location.fill", android: "my_location", bg: colors.blue }}
            title={origin ? "Using your location" : "Use My Location"}
            trailing={origin ? <RowButton label="Home" onPress={() => setOrigin(null)} /> : <RowButton label="Find" busy={locating} onPress={useMyLocation} />}
          />
          {categories.length ? (
            <Row icon={{ ios: "square.grid.2x2.fill", android: "grid_view", bg: colors.gray }} title="Section" value={category?.label ?? "All"} chevron onPress={pickCategory} />
          ) : null}
        </Section>

        {problem ? (
          <Empty icon="mappin.slash" title="We can't find you yet" message={`${problem} Tap Find above to use where you are now.`} />
        ) : products && !products.length ? (
          <Empty
            icon="cross.case"
            title={search || category ? "Nothing matches" : "No pharmacy delivers here yet"}
            message={search || category ? "Try another word or section." : "We only show approved pharmacies that deliver to your address."}
          />
        ) : null}

        <Section title="From your prescriptions">{prescribed.map(productRow)}</Section>
        <Section title={prescribed.length ? "Everything else" : undefined} footer={rest.length ? "Ordering from the app is coming next. For now you can order these on the Clarity website." : undefined}>
          {rest.map(productRow)}
        </Section>
      </Page>
    </>
  );
}
