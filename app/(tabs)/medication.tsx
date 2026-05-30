import { Text, View } from "react-native";

export default function MedicationsScreen() {
  return (
    <View className="flex-1 bg-slate-50 items-center justify-center">
      <Text className="text-slate-900 font-black text-xl">Medications</Text>
      <Text className="text-slate-400 font-medium mt-2">Coming next</Text>
    </View>
  );
}
