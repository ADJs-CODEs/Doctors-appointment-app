import { Stack } from "expo-router";
import { nativeHeader } from "../../../components/native";

export default function TabStack() {
  return <Stack screenOptions={nativeHeader} />;
}
