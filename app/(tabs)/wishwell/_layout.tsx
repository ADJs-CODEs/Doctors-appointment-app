import { Stack } from "expo-router";
import { nativeHeader } from "../../../components/native";

export default function WishWellStack() {
  return <Stack screenOptions={nativeHeader} />;
}
