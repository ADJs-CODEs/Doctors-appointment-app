import { Tabs } from "expo-router";
import { Text, View } from "react-native";

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

const TabIcon = ({ emoji, label, focused }: TabIconProps) => (
  <View className="items-center justify-center pt-2">
    <Text style={{ fontSize: 22 }}>{emoji}</Text>
    <Text
      className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
        focused ? "text-teal-500" : "text-slate-400"
      }`}
    >
      {label}
    </Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" label="Bookings" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💊" label="Meds" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="watching"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👁️" label="Watching" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
