import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";

export default function CounselorTabsLayout() {
  const { currentUser, ready } = useApp();
  if (ready && !currentUser) return <Redirect href="/login" />;
  if (ready && currentUser?.role === "admin")
    return <Redirect href="/admin" />;
  if (ready && currentUser && currentUser.role !== "counselor")
    return <Redirect href="/(tabs)" />;
  if (ready && currentUser && !currentUser.onboardingComplete)
    return <Redirect href="/onboarding" />;
  if (ready && currentUser && !currentUser.consentAccepted)
    return <Redirect href="/consent" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tealDark,
        tabBarInactiveTintColor: "#53645F",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 9,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sessions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="counselor-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="availability" options={{ href: null }} />
    </Tabs>
  );
}
