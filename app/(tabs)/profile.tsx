import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Avatar, Card, Screen } from "../../components/ui";
import { colors, moodOptions } from "../../constants/theme";
import { useApp } from "../../context/AppContext";

export default function ProfileTab() {
  const { currentUser, state, logout, updateProfile } = useApp();
  if (!currentUser) return null;

  const handleProfilePhotoUpdate = async (nextImage?: string) => {
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

  const latestMood = state.moods
    .filter((entry) => entry.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const moodLabel = moodOptions.find(
    (mood) => mood.key === latestMood?.mood,
  )?.label;

  return (
    <Screen scroll={false} padded={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator
        overScrollMode="always"
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Pressable
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
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={16} color={colors.coral} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarColumn}>
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
                <View style={styles.avatarWrap}>
                  <Avatar
                    name={currentUser.name}
                    color={currentUser.avatarColor}
                    size={56}
                    profileType="student"
                    profileImage={currentUser.profileImage}
                  />
                  <View style={styles.onlineDot} />
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={11} color={colors.white} />
                  </View>
                </View>
              </Pressable>
              <Text style={styles.avatarHint}>Add/update photo</Text>
            </View>
            <View style={styles.identity}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {currentUser.name}
                </Text>
                <View style={styles.accountBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.tealDark}
                  />
                  <Text style={styles.accountBadgeText}>
                    {currentUser.isAnonymous
                      ? "Pseudonym active"
                      : "Campus account"}
                  </Text>
                </View>
              </View>
              <Text style={styles.studentMeta}>
                {[currentUser.major, currentUser.year]
                  .filter(Boolean)
                  .join(" · ") || "Student"}
              </Text>
              {moodLabel ? (
                <View style={styles.moodBadge}>
                  <Ionicons
                    name="leaf-outline"
                    size={11}
                    color={colors.tealDark}
                  />
                  <Text style={styles.moodText}>
                    Feeling {moodLabel.toLowerCase()}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.shortcutGrid}>
            <Shortcut
              icon="shield-checkmark-outline"
              label="Safety settings"
              onPress={() =>
                router.push({
                  pathname: "/trusted-contacts",
                  params: { returnTo: "/(tabs)/profile" },
                })
              }
            />
            <Shortcut
              icon="notifications-outline"
              label="Notifications"
              onPress={() => router.push("/notifications")}
            />
            <Shortcut
              icon="person-circle-outline"
              label="Profile & privacy"
              onPress={() => router.push("/settings")}
            />
            <Shortcut
              icon="eye-off-outline"
              label="Advanced privacy"
              onPress={() => router.push("/privacy")}
            />
          </View>
        </Card>

        <Card style={styles.detailsCard}>
          <View style={styles.detailsHeading}>
            <Text style={styles.sectionTitle}>Student information</Text>
            <Text style={styles.privateLabel}>Private</Text>
          </View>
          <ProfileDetail label="FULL NAME" value={currentUser.name} />
          <ProfileDetail
            label="ACADEMIC YEAR"
            value={currentUser.year || "Not set"}
          />
          <ProfileDetail label="MAJOR" value={currentUser.major || "Not set"} />
          <ProfileDetail
            label="PHONE NUMBER"
            value={currentUser.phone || "Not set"}
          />
          <ProfileDetail label="EMAIL ADDRESS" value={currentUser.email} />
          <Text style={styles.privacyNote}>
            Your profile details are only shared with your counselor when needed
            for your sessions.
          </Text>
        </Card>

        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={18} color={colors.white} />
          <Text style={styles.editButtonText}>Edit profile information</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.shortcutText}>{label}</Text>
      <Ionicons name={icon} size={15} color={colors.tealDark} />
    </Pressable>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  page: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 12,
  },
  titleRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
  profileCard: { padding: 16, borderRadius: 18 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarColumn: { alignItems: "center", gap: 4 },
  avatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.teal,
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#4BA89E",
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    color: colors.tealDark,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  identity: { flex: 1, gap: 5 },
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  name: {
    maxWidth: "100%",
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.mint,
  },
  accountBadgeText: { color: colors.tealDark, fontSize: 12, fontWeight: "600" },
  studentMeta: { color: colors.muted, fontSize: 15 },
  moodBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
  },
  moodText: { color: "#596A9B", fontSize: 13, fontWeight: "600" },
  shortcutGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  shortcut: {
    width: "48%",
    minHeight: 42,
    flexGrow: 1,
    flexBasis: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#F1F3FF",
  },
  shortcutText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  detailsCard: { padding: 16, borderRadius: 18 },
  detailsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  sectionTitle: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  privateLabel: { color: colors.tealDark, fontSize: 13, fontWeight: "600" },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  detailValue: { color: colors.text, fontSize: 14 },
  privacyNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 10,
  },
  editButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#5BA48F",
  },
  editButtonText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  logoutButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#F3CDD0",
  },
  logoutText: { color: colors.coral, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
