import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";

interface TabIconProps {
  label: string;
  focused: boolean;
  icon: string;
}

const TabIcon = ({ label, focused, icon }: TabIconProps) => (
  <View className="items-center justify-center pt-1">
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text
      style={{
        fontSize: 9,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
        color: focused ? "#14b8a6" : "#64748b",
      }}
    >
      {label}
    </Text>
  </View>
);

export default function DoctorTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 85 : 70,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label="Overview" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" label="Patients" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
