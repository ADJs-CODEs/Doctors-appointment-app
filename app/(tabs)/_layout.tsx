import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}

const TabBarIcon = ({ name, focused, color }: TabBarIconProps) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Ionicons
      name={
        focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)
      }
      size={24}
      color={color}
    />
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#0d9488",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          tabBarLabel: "Doctors",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="medical" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarLabel: "Bookings",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          tabBarLabel: "Meds",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="medkit" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="watching"
        options={{
          tabBarLabel: "Watch",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="eye" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
