import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { getActiveCounselorId } from "../../lib/counselor";
import { studentDisplayName } from "../../lib/student-privacy";

export default function CounselorDashboard() {
  const { currentUser, state } = useApp();
  const counselorId = getActiveCounselorId(currentUser, state.counselors);
  const availability = state.availabilities?.find(
    (item) => item.counselorId === counselorId,
  );

  // Filter stats & upcoming items
  const myAppointments = state.appointments.filter(
    (a) => a.counselorId === counselorId,
  );
  const pendingRequests = myAppointments.filter((a) => a.status === "pending");
  const upcomingToday = myAppointments.filter((a) => a.status === "upcoming");
  const unreadNotifications =
    state.notifications?.filter((n) => !n.read).length ?? 0;
  const welcomeName =
    currentUser?.name.replace(/^Dr\.?\s*/, "").split(" ")[0] ?? "there";
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHeader}>
          <Image
            source={require("../../assets/images/logo.jpg")}
            style={styles.brandMark}
            accessibilityLabel="MindCare logo"
          />
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>MindCare</Text>
            <Text style={styles.brandCaption}>COUNSELOR DASHBOARD</Text>
          </View>
          <Pressable
            style={styles.profileAvatar}
            onPress={() => router.push("/counselor-profile")}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Text style={styles.profileAvatarText}>
              {currentUser?.name
                .replace(/^Dr\.?\s*/, "")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("") ?? "SP"}
            </Text>
            {unreadNotifications > 0 ? (
              <View style={styles.notifBadge} />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Good morning, {welcomeName}</Text>
          <Text style={styles.welcomeSub}>
            Take a breath. Today is yours to shape.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <Text style={styles.monthLabel}>
            {new Date()
              .toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.weekStrip}>
          {weekDays.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <Pressable
                key={date.toISOString()}
                onPress={() => router.push("/(counselor-tabs)/calendar")}
                style={styles.weekDay}
              >
                <Text style={styles.weekDayName}>
                  {date
                    .toLocaleDateString(undefined, { weekday: "short" })
                    .slice(0, 1)}
                </Text>
                <View
                  style={[styles.weekDate, isToday && styles.weekDateToday]}
                >
                  <Text
                    style={[
                      styles.weekDateText,
                      isToday && styles.weekDateTextToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.caseloadCard}>
          <View style={styles.caseloadHeader}>
            <Text style={styles.caseloadTitle}>Today&apos;s Caseload</Text>
            <Text style={styles.totalPill}>
              {upcomingToday.length + pendingRequests.length} Total
            </Text>
          </View>
          <View style={styles.caseloadStats}>
            <Pressable
              style={styles.caseloadStat}
              onPress={() => router.push("/(counselor-tabs)/sessions")}
            >
              <Text style={styles.statCaption}>SCHEDULED</Text>
              <Text style={styles.statNumber}>{upcomingToday.length}</Text>
              <Text style={styles.statHint}>Upcoming Sessions</Text>
            </Pressable>
            <Pressable
              style={styles.caseloadStat}
              onPress={() =>
                router.push("/(counselor-tabs)/sessions?tab=pending")
              }
            >
              <Text style={styles.statCaptionUrgent}>URGENT TRIAGE</Text>
              <Text style={styles.statNumberUrgent}>
                {pendingRequests.length}
              </Text>
              <Text style={styles.statHintUrgent}>Requires Review</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="calendar-outline"
            title="Update Availability"
            subtitle="Open next week's morning counseling slots"
            onPress={() => router.push("/counselor-availability")}
          />
          <QuickAction
            icon="radio-outline"
            title="Broadcast Open Slot"
            subtitle="Notify waitlisted students about openings"
            onPress={() => router.push("/counselor-availability")}
          />
          <QuickAction
            icon="alert-circle-outline"
            title="Emergency Escalation Protocol"
            subtitle="Review urgent student requests"
            onPress={() => router.push("/counselor-requests")}
          />
        </View>

        <Pressable
          onPress={() => router.push("/counselor-availability")}
          style={styles.availabilityCard}
          accessibilityRole="button"
          accessibilityLabel="View and edit your saved availability"
        >
          <View style={styles.availabilityHeader}>
            <View style={styles.availabilityTitleGroup}>
              <View style={styles.availabilityIcon}>
                <Ionicons
                  name="time-outline"
                  size={19}
                  color={colors.tealDark}
                />
              </View>
              <View style={styles.availabilityTitleCopy}>
                <Text style={styles.availabilityTitle}>
                  Your available slots
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {availability?.isAcceptingSessions === false
                    ? "Not accepting new sessions"
                    : "Visible to students for booking"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
          {availability?.days.filter((day) => day.enabled).length ? (
            <View style={styles.availabilityDays}>
              {availability.days
                .filter((day) => day.enabled)
                .map((day) => (
                  <View key={day.day} style={styles.availabilityDay}>
                    <Text style={styles.availabilityDayName}>{day.day}</Text>
                    <Text style={styles.availabilityDayHours}>
                      {day.start} – {day.end}
                    </Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={styles.noAvailability}>
              No weekly slots set up yet. Tap to add availability.
            </Text>
          )}
          {availability ? (
            <View style={styles.availabilityFooter}>
              <Text style={styles.availabilityMeta}>
                {availability.recurringWeekly
                  ? "Repeats weekly"
                  : "One-time schedule"}
              </Text>
              <Text style={styles.availabilityMeta}>Tap to edit</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <Pressable onPress={() => router.push("/(counselor-tabs)/sessions")}>
            <Text style={styles.seeAll}>View all</Text>
          </Pressable>
        </View>
        {upcomingToday.length ? (
          upcomingToday.slice(0, 3).map((item) => {
            const student = state.users.find((user) => user.id === item.userId);
            const name = studentDisplayName(student, item.isAnonymous);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/counselor-appoinment/${item.id}`)}
                style={styles.sessionRow}
              >
                <View style={styles.sessionTime}>
                  <Text style={styles.sessionTimeText}>{item.time}</Text>
                </View>
                <View style={styles.sessionCopy}>
                  <Text style={styles.sessionName}>{name}</Text>
                  <Text style={styles.sessionNote} numberOfLines={1}>
                    {item.notes}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.muted}
                />
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptySessions}>
            No upcoming sessions are scheduled.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.quickAction}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={16} color={colors.tealDark} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  brandMark: {
    width: 34,
    height: 30,
    borderRadius: 6,
  },
  brandCopy: { flex: 1, gap: 1 },
  brandName: { color: "#397E72", fontSize: 14, fontWeight: "700" },
  brandCaption: { color: "#53645F", fontSize: 12, fontWeight: "600" },
  profileAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E5F3EE",
  },
  profileAvatarText: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: "700",
  },
  notifBadge: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  welcomeCard: {
    padding: 11,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  welcomeTitle: { color: "#397E72", fontSize: 16, fontWeight: "700" },
  welcomeSub: {
    color: "#53645F",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: { color: "#397E72", fontSize: 14, fontWeight: "700" },
  monthLabel: { color: "#53645F", fontSize: 13, fontWeight: "600" },
  weekStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    padding: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  weekDay: { flex: 1, alignItems: "center", gap: 3 },
  weekDayName: { color: "#53645F", fontSize: 12, fontWeight: "600" },
  weekDate: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
  },
  weekDateToday: { backgroundColor: "#D7EEE7", borderColor: "#55A998" },
  weekDateText: { color: "#53645F", fontSize: 13, fontWeight: "600" },
  weekDateTextToday: { color: colors.tealDark, fontWeight: "700" },
  caseloadCard: {
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  caseloadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  caseloadTitle: { color: "#28695E", fontSize: 15, fontWeight: "700" },
  totalPill: {
    color: "#28695E",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
  },
  caseloadStats: { flexDirection: "row", gap: 5 },
  caseloadStat: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
  },
  statCaption: { color: "#53645F", fontSize: 12, fontWeight: "600" },
  statNumber: {
    color: "#28695E",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  statHint: { color: "#397E72", fontSize: 12, fontWeight: "600" },
  statCaptionUrgent: { color: "#A9533E", fontSize: 12, fontWeight: "600" },
  statNumberUrgent: {
    color: "#A9533E",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  statHintUrgent: { color: "#A9533E", fontSize: 12, fontWeight: "600" },
  quickActions: { gap: 8, marginBottom: 16 },
  quickAction: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  quickIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#79B7A6",
    borderRadius: 8,
    backgroundColor: "#EFF7F3",
  },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { color: "#397E72", fontSize: 15, fontWeight: "600" },
  quickSubtitle: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  availabilityCard: {
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  availabilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  availabilityTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  availabilityIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  availabilityTitleCopy: { flex: 1, gap: 3 },
  availabilityTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  availabilitySubtitle: { color: "#53645F", fontSize: 14, fontWeight: "500" },
  availabilityDays: { gap: 7, paddingTop: 2, paddingBottom: 10 },
  availabilityDay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  availabilityDayName: { color: colors.text, fontSize: 15, fontWeight: "700" },
  availabilityDayHours: {
    color: colors.tealDark,
    fontSize: 15,
    fontWeight: "600",
  },
  noAvailability: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 19,
    paddingVertical: 4,
  },
  availabilityFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  availabilityMeta: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  seeAll: { color: colors.tealDark, fontSize: 13, fontWeight: "600" },
  sessionRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  sessionTime: {
    width: 60,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: "#EFF7F3",
    alignItems: "center",
  },
  sessionTimeText: { color: colors.tealDark, fontSize: 13, fontWeight: "600" },
  sessionCopy: { flex: 1, gap: 3 },
  sessionName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  sessionNote: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  emptySessions: {
    color: "#53645F",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 12,
  },
});
