import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName, focused: boolean) {
  return <Ionicons name={name} size={24} color={focused ? colors.cyan600 : colors.textMuted} />;
}

export default function DriverTabsLayout() {
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "grid" : "grid-outline", focused),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "clipboard" : "clipboard-outline", focused),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Commission",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "cash" : "cash-outline", focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "person" : "person-outline", focused),
        }}
      />
    </Tabs>
  );
}
