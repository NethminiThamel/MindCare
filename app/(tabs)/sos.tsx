import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";

export default function Sos() {
  const { currentUser, state } = useApp();
  const trustedContact = state.contacts.find(
    (contact) => contact.userId === currentUser?.id,
  );
  const breathingResource = state.crisisResources.find(
    (resource) => resource.category === "coping",
  );

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.navigate("/(tabs)")}
            style={styles.back}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Avatar
              name={currentUser?.name ?? "Student"}
              color={currentUser?.avatarColor ?? colors.teal}
              size={30}
              profileType="student"
              profileImage={currentUser?.profileImage}
            />
          </Pressable>
        </View>

        <Text style={styles.title}>Safety Center</Text>
        <Text style={styles.subtitle}>
          Instant access to immediate, judgment-free support
        </Text>

        <Pressable
          onPress={() => Linking.openURL("tel:988")}
          style={styles.helpline}
          accessibilityRole="button"
        >
          <View style={styles.callIcon}>
            <Ionicons name="call" size={16} color={colors.white} />
          </View>
          <Text style={styles.helplineTitle}>Call Crisis Helpline</Text>
          <Text style={styles.helplineSub}>
            Dial 988 - Free, Confidential &amp; 24/7 Support
          </Text>
        </Pressable>

        <ActionRow
          icon="chatbubble-outline"
          title="Text a Counselor"
          detail="Quick chat with certified helpline responders"
          badge="< 2 min wait"
          onPress={() => Linking.openURL("sms:988")}
        />
        <ActionRow
          icon="heart-outline"
          title="Contact Trusted Person"
          detail={
            trustedContact
              ? `Call ${trustedContact.name} (${trustedContact.relation})`
              : "Call Sarah Mathews (Sister)"
          }
          onPress={() =>
            trustedContact
              ? Linking.openURL(`tel:${trustedContact.phone}`)
              : router.push({
                  pathname: "/trusted-contacts",
                  params: { returnTo: "/(tabs)/sos" },
                })
          }
        />
        <ActionRow
          icon="options-outline"
          title="Breathing Exercise"
          detail="Calm acute panic with paced 4-7-8 respiration"
          onPress={() =>
            router.push(
              breathingResource
                ? `/crisis/${breathingResource.id}`
                : "/resources",
            )
          }
        />

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/trusted-contacts",
              params: { returnTo: "/(tabs)/sos" },
            })
          }
          style={styles.contactsButton}
          accessibilityRole="button"
        >
          <Ionicons name="person-add-outline" size={14} color={colors.white} />
          <Text style={styles.contactsText}>Add Trusted contacts</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ActionRow({
  icon,
  title,
  detail,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={15} color={colors.tealDark} />
      </View>
      <View style={styles.actionCopy}>
        <View style={styles.actionTitleRow}>
          <Text style={styles.actionTitle}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.actionDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#778A84" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingRight: 10,
  },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: {
    color: "#254C47",
    fontSize: 33,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 290,
    alignSelf: "center",
    color: "#5D7A73",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  helpline: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#F28F8B",
    paddingVertical: 16,
  },
  callIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  helplineTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  helplineSub: {
    color: colors.white,
    fontSize: 13,
    opacity: 0.96,
    textAlign: "center",
    paddingHorizontal: 18,
  },
  actionRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D8E7E3",
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.78 },
  actionIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF4F2",
  },
  actionCopy: { flex: 1, minWidth: 0, gap: 3 },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actionTitle: { color: "#2E4D4A", fontSize: 15, fontWeight: "600" },
  actionDetail: { color: "#6F837E", fontSize: 12, lineHeight: 16 },
  badge: {
    color: "#378D73",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#E5F5EC",
  },
  contactsButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "#57B7A8",
  },
  contactsText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
