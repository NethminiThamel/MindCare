import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Avatar, Card, Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";

export default function CounselorProfile() {
  const { currentUser, state, logout, updateProfile } = useApp();
  const counselor = state.counselors.find(
    (item) => item.id === currentUser?.id,
  );
  const appointments = state.appointments.filter(
    (item) => item.counselorId === currentUser?.id,
  );
  const activeCases = appointments.filter(
    (item) => item.status === "upcoming" || item.status === "pending",
  ).length;
  const unreadNotifications =
    state.notifications?.filter(
      (item) => item.counselorId === currentUser?.id && !item.read,
    ).length ?? 0;

  const handleProfilePhotoUpdate = async (nextImage?: string) => {
    if (!currentUser) return;

    try {
      await updateProfile({ profileImage: nextImage || undefined });
      Alert.alert(
        nextImage ? "Profile photo updated" : "Profile photo cleared",
        nextImage
          ? "Your new profile picture has been saved."
          : "Your profile picture has been reset to default.",
      );
    } catch (error) {
      Alert.alert(
        "Could not update your photo",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const openProfilePhotoPicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos so you can set a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    await handleProfilePhotoUpdate(result.assets[0].uri);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHeader}>
          <View style={styles.brandMark}>
            <Image
              source={require("../../assets/images/logo.jpg")}
              style={styles.brandLogo}
              accessibilityLabel="MindCare logo"
            />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>MindCare</Text>
            <Text style={styles.brandCaption}>COUNSELOR DASHBOARD</Text>
          </View>
          <Pressable
            onPress={() => {
              Alert.alert(
                "Add or update your profile photo",
                "Choose a photo from your library or reset to the default.",
                [
                  {
                    text: "Choose photo",
                    onPress: () => {
                      void openProfilePhotoPicker();
                    },
                  },
                  {
                    text: "Use default photo",
                    onPress: () => {
                      void handleProfilePhotoUpdate(undefined);
                    },
                  },
                  { text: "Cancel", style: "cancel" },
                ],
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Add or update profile picture"
          >
            <View style={styles.profileAvatar}>
              <Avatar
                name={currentUser?.name ?? "Counselor"}
                color={currentUser?.avatarColor ?? colors.tealDark}
                size={42}
                profileType="counselor"
                profileImage={currentUser?.profileImage}
              />
            </View>
          </Pressable>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Add or update your profile photo",
                  "Choose a photo from your library or reset to the default.",
                  [
                    {
                      text: "Choose photo",
                      onPress: () => {
                        void openProfilePhotoPicker();
                      },
                    },
                    {
                      text: "Use default photo",
                      onPress: () => {
                        void handleProfilePhotoUpdate(undefined);
                      },
                    },
                    { text: "Cancel", style: "cancel" },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Add or update profile picture"
            >
              <View style={styles.avatar}>
                <Avatar
                  name={currentUser?.name ?? "Counselor"}
                  color={currentUser?.avatarColor ?? colors.tealDark}
                  size={56}
                  profileType="counselor"
                  profileImage={currentUser?.profileImage}
                />
              </View>
            </Pressable>
            <View style={styles.profileCopy}>
              <View style={styles.verified}>
                <Ionicons name="checkmark-circle" size={9} color="#4EA88E" />
                <Text style={styles.verifiedText}>
                  VERIFIED CAMPUS COUNSELOR
                </Text>
              </View>
              <Text style={styles.name}>
                {currentUser?.name ?? "Counselor"}
              </Text>
              <Text style={styles.titleText}>
                {currentUser?.title ?? counselor?.title ?? "Counselor"}
              </Text>
              <Text style={styles.emailText}>{currentUser?.email ?? ""}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Metric
              value={(counselor?.rating ?? 4.9).toFixed(1)}
              label="Rating"
            />
            <Metric
              value={`${counselor?.years ?? 8}+ yrs`}
              label="Experience"
            />
            <Metric value={String(activeCases)} label="Active Cases" />
            <Metric value={String(unreadNotifications)} label="New Alerts" />
          </View>
        </Card>

        <View style={styles.profileActions}>
          <Pressable
            onPress={() => router.push("/counselor-availability")}
            style={styles.primaryProfileAction}
            accessibilityRole="button"
          >
            <Text style={styles.primaryProfileText}>Update Slots</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/counselor-requests")}
            style={styles.secondaryProfileAction}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryProfileText}>Triage Criteria</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Session Offerings &amp; Care Paths
        </Text>
        <Card style={styles.offeringsCard}>
          <OfferingRow
            icon="videocam-outline"
            title="Telehealth Video Encounter"
            detail="Secure video session"
            status="Active"
          />
          <OfferingRow
            icon="chatbubble-ellipses-outline"
            title="Secure Clinical Chat"
            detail="30 min · Real-Time Guided Check-In"
            status="Active"
          />
          <OfferingRow
            icon="people-outline"
            title="In-Person Crisis Walk-In"
            detail="On-site student support"
            status="On-Duty"
            urgent
          />
        </Card>

        {/* Counselor Tools Shortcuts */}
        <Text style={styles.sectionTitle}>Counselor Portal Settings</Text>

        <Card style={styles.menuCard}>
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/counselor-availability")}
          >
            <Ionicons name="time-outline" size={20} color={colors.tealDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>
                Manage Office Hours & Availability
              </Text>
              <Text style={styles.menuSub}>
                Set weekly schedule, buffer times & video rules
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/counselor-completed")}
          >
            <Ionicons name="star-outline" size={20} color={colors.tealDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>
                Completed Sessions & Student Ratings
              </Text>
              <Text style={styles.menuSub}>
                View session history & feedback comments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.tealDark}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Alerts & Notifications Feed</Text>
              <Text style={styles.menuSub}>
                Configure appointment & chat alerts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </Card>

        {/* Switch Role or Logout */}
        <Pressable
          style={styles.switchBtn}
          onPress={() => {
            router.replace("/(tabs)");
          }}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={18}
            color={colors.tealDark}
          />
          <Text style={styles.switchText}>Switch to Student View (Demo)</Text>
        </Pressable>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (error) {
              Alert.alert(
                "Unable to log out",
                error instanceof Error ? error.message : "Please try again.",
              );
            }
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.coral} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function OfferingRow({
  icon,
  title,
  detail,
  status,
  urgent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  status: string;
  urgent?: boolean;
}) {
  return (
    <View style={styles.offeringRow}>
      <View style={[styles.offeringIcon, urgent && styles.offeringIconUrgent]}>
        <Ionicons
          name={icon}
          size={14}
          color={urgent ? "#D98766" : colors.tealDark}
        />
      </View>
      <View style={styles.offeringCopy}>
        <Text style={styles.offeringTitle}>{title}</Text>
        <Text style={styles.offeringDetail}>{detail}</Text>
      </View>
      <Text
        style={[styles.offeringStatus, urgent && styles.offeringStatusUrgent]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogo: { width: 34, height: 30, borderRadius: 6 },
  brandCopy: { flex: 1, gap: 1 },
  brandName: { color: "#397E72", fontSize: 15, fontWeight: "700" },
  brandCaption: { color: "#53645F", fontSize: 12, fontWeight: "600" },
  profileAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E9F2EE",
  },
  profileAvatarText: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: "700",
  },
  profileCard: { padding: 14, marginBottom: 10, borderRadius: 12 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  profileCopy: { flex: 1, minWidth: 0, gap: 2 },
  verified: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { color: "#28695E", fontSize: 12, fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  titleText: { fontSize: 14, color: colors.tealDark },
  emailText: { fontSize: 13, color: "#53645F", fontWeight: "500" },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  metricValue: { color: "#D5996F", fontSize: 14, fontWeight: "600" },
  metricLabel: {
    color: "#53645F",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  profileActions: { flexDirection: "row", gap: 8, marginBottom: 16 },
  primaryProfileAction: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#5BA48F",
  },
  primaryProfileText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  secondaryProfileAction: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  secondaryProfileText: { color: colors.tealDark, fontSize: 14 },
  sectionTitle: {
    color: "#397E72",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  offeringsCard: { padding: 10, marginBottom: 16, borderRadius: 12 },
  offeringRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  offeringIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#E6F2ED",
  },
  offeringIconUrgent: { backgroundColor: "#FAE4D5" },
  offeringCopy: { flex: 1, gap: 2 },
  offeringTitle: { color: "#477B6D", fontSize: 14, fontWeight: "600" },
  offeringDetail: { color: "#53645F", fontSize: 12, fontWeight: "500" },
  offeringStatus: { color: "#28695E", fontSize: 12, fontWeight: "600" },
  offeringStatusUrgent: { color: "#98563F" },
  menuCard: { padding: 6, marginBottom: 16, borderRadius: 12 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  menuSub: { fontSize: 13, color: "#53645F", fontWeight: "500", marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 9 },
  switchBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5F3",
    paddingVertical: 13,
    borderRadius: 11,
    marginBottom: 9,
  },
  switchText: { color: colors.tealDark, fontWeight: "700", fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
  },
  logoutText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
