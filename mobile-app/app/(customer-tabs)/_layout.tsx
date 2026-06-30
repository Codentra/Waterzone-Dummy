import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName, focused: boolean) {
  return <Ionicons name={name} size={24} color={focused ? colors.cyan600 : colors.textMuted} />;
}

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan600,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ focused }) => tabIcon(focused ? "home" : "home-outline", focused) }} />
      <Tabs.Screen name="order" options={{ title: "Order", tabBarIcon: ({ focused }) => tabIcon(focused ? "water" : "water-outline", focused) }} />
      <Tabs.Screen name="contract" options={{ title: "Contract", tabBarIcon: ({ focused }) => tabIcon(focused ? "document-text" : "document-text-outline", focused) }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ focused }) => tabIcon(focused ? "person" : "person-outline", focused) }} />
    </Tabs>
  );
}
