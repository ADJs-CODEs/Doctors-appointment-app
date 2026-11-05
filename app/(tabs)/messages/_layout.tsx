import { Stack } from "expo-router";
import { detailHeader, nativeHeader } from "../../../components/native";

export default function MessagesStack() {
  return (
    <Stack screenOptions={nativeHeader}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[docId]" options={{ ...detailHeader, title: "" }} />
    </Stack>
  );
}
