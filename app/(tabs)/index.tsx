import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Card, Screen } from "../../components/ui";
import { colors, moodOptions, type MoodKey } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { formatDate, formatTime, moodsByUser } from "../../lib/format";

const homeMoods = moodOptions.filter((mood) => mood.key !== "okay");
const homeMoodLabels: Partial<Record<MoodKey, string>> = {
  great: "Happy",
  good: "Calm",
};

export default function Dashboard() {
  const { currentUser, state } = useApp();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const mine = state.appointments.filter(
    (appointment) => appointment.userId === currentUser?.id,
  );
  const next = [...mine]
    .filter(
      (appointment) =>
        appointment.status === "upcoming" || appointment.status === "pending",
    )
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )[0];
  const counselor = next
    ? state.counselors.find((item) => item.id === next.counselorId)
    : undefined;
  const entries = currentUser ? moodsByUser(state.moods, currentUser.id) : [];
  const trend = entries.slice(0, 7).reverse();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const sessionsThisMonth = mine.filter(
    (appointment) =>
      appointment.date.startsWith(monthKey) &&
      appointment.status !== "cancelled",
  ).length;

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MindCare</Text>
          <Text style={styles.kicker}>WELLNESS DASHBOARD</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Avatar
            name={currentUser?.name ?? "Student"}
            color={currentUser?.avatarColor ?? colors.teal}
            size={34}
            profileType="student"
            profileImage={currentUser?.profileImage}
          />
        </Pressable>
      </View>

      <Card style={styles.welcomeCard}>
        <Text style={styles.welcome}>
          Good morning, {currentUser?.name.split(" ")[0] ?? "there"}
        </Text>
        <Text style={styles.sub}>Take a breath. Today is yours to shape.</Text>
      </Card>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <Text style={styles.month}>
          {today.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>
      <View style={styles.weekCard}>
        {week.map((date) => {
          const selected = date.toDateString() === today.toDateString();
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => router.push("/(tabs)/moods")}
              style={styles.dayItem}
            >
              <Text style={styles.dayName}>
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </Text>
              <View
                style={[
                  styles.dayNumberWrap,
                  selected && styles.dayNumberSelected,
                ]}
              >
                <Text
                  style={[styles.dayNumber, selected && styles.dayNumberActive]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <Pressable onPress={() => router.push("/(tabs)/moods")}>
          <Text style={styles.sectionLink}>History</Text>
        </Pressable>
      </View>
      <Card style={styles.moodCard}>
        <Text style={styles.sub}>
          Tap your mood to log today&apos;s check-in
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRow}
        >
          {homeMoods.map((mood) => (
            <Pressable
              key={mood.key}
              onPress={() => router.push("/(tabs)/checkin")}
              style={styles.moodChoice}
              accessibilityRole="button"
              accessibilityLabel={`Check in as ${homeMoodLabels[mood.key] ?? mood.label}`}
            >
              <View style={styles.moodIcon}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              </View>
              <Text style={styles.moodLabel} numberOfLines={1}>
                {homeMoodLabels[mood.key] ?? mood.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <Text style={[styles.sectionTitle, styles.quickHeading]}>
        Quick Actions
      </Text>
      <Pressable
        onPress={() => router.push("/counselors")}
        style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
      >
        <View style={styles.actionIcon}>
          <Ionicons
            name="person-add-outline"
            size={18}
            color={colors.tealDark}
          />
        </View>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>Book Counselor</Text>
          <Text style={styles.actionSub}>Connect with a therapist</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => router.push("/(tabs)/sos")}
        style={({ pressed }) => [styles.crisisCard, pressed && styles.pressed]}
      >
        <View style={styles.crisisIcon}>
          <Ionicons name="call" size={22} color={colors.white} />
        </View>
        <Text style={styles.crisisTitle}>Call Crisis Helpline</Text>
        <Text style={styles.crisisSub}>
          Dial 988 · Free, Confidential &amp; 24/7 Support
        </Text>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Pressable onPress={() => router.push("/(tabs)/trends")}>
          <Text style={styles.sectionLink}>Mood trends</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push("/(tabs)/trends")}>
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>
                🔥 {checkinStreak(entries)}-day streak
              </Text>
            </View>
            <Text style={styles.sessionCount}>
              {sessionsThisMonth} sessions this month
            </Text>
          </View>
          <Text style={styles.trendLabel}>Mood trend</Text>
          <View style={styles.chartRow}>
            {trend.length ? (
              trend.map((entry) => (
                <View key={entry.id} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: 9 + entry.stressLevel * 3 },
                    ]}
                  />
                  <Text style={styles.chartDay}>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      weekday: "narrow",
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyTrend}>
                Your check-ins will build this trend.
              </Text>
            )}
          </View>
        </Card>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        <Pressable onPress={() => router.push("/(tabs)/sessions?tab=upcoming")}>
          <Text style={styles.sectionLink}>All</Text>
        </Pressable>
      </View>
      {next && counselor ? (
        <Pressable onPress={() => router.push("/(tabs)/sessions?tab=upcoming")}>
          <Card style={styles.sessionCard}>
            <View style={styles.sessionIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.tealDark}
              />
            </View>
            <View style={styles.sessionCopy}>
              <Text style={styles.sessionTitle}>
                {counselor.name} · {counselor.specialties[0]}
              </Text>
              <Text style={styles.sessionSub}>
                {formatDate(next.date)} at {formatTime(next.time)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.muted} />
          </Card>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/(tabs)/sessions?tab=upcoming")}>
          <Card style={styles.sessionCard}>
            <View style={styles.sessionIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.tealDark}
              />
            </View>
            <View style={styles.sessionCopy}>
              <Text style={styles.sessionTitle}>No upcoming sessions</Text>
              <Text style={styles.sessionSub}>
                Browse counselors and find a time that works.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.muted} />
          </Card>
        </Pressable>
      )}

      <Text style={[styles.sectionTitle, styles.supportHeading]}>
        Community &amp; Support
      </Text>
      <View style={styles.supportRow}>
        <SupportCard
          icon="chatbox-ellipses-outline"
          title="Feedback"
          subtitle="Share your thoughts"
          onPress={() => router.push("/(tabs)/feedback")}
        />
        <SupportCard
          icon="people-outline"
          title="Counselors"
          subtitle="Find support"
          onPress={() => router.push("/counselors")}
        />
        <SupportCard
          icon="help-circle-outline"
          title="FAQ"
          subtitle="Get answers"
          onPress={() => router.push("/help")}
        />
      </View>
    </Screen>
  );
}

function checkinStreak(entries: { createdAt: string }[]) {
  const loggedDays = new Set(
    entries.map((entry) => {
      const date = new Date(entry.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  );
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const key = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (!loggedDays.has(key(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (loggedDays.has(key(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function SupportCard({
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
      onPress={onPress}
      style={({ pressed }) => [styles.supportCard, pressed && styles.pressed]}
    >
      <View style={styles.supportIcon}>
        <Ionicons name={icon} size={18} color={colors.tealDark} />
      </View>
      <Text style={styles.supportTitle}>{title}</Text>
      <Text style={styles.supportSub}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: { color: "#3D8276", fontSize: 19, fontWeight: "700" },
  kicker: { color: colors.muted, fontSize: 11, marginTop: 2 },
  welcomeCard: { padding: 14, marginBottom: 14 },
  welcome: { color: "#3D8276", fontSize: 19, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 12, marginTop: 5 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    marginBottom: 8,
  },
  sectionTitle: { color: "#357A6F", fontSize: 15, fontWeight: "600" },
  sectionLink: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  month: { color: colors.muted, fontSize: 11, textTransform: "uppercase" },
  weekCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 7,
    marginBottom: 14,
  },
  dayItem: { alignItems: "center", gap: 5 },
  dayName: { color: colors.muted, fontSize: 11 },
  dayNumberWrap: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberSelected: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  dayNumber: { color: colors.muted, fontSize: 12 },
  dayNumberActive: { color: colors.tealDark, fontWeight: "700" },
  moodCard: { padding: 12, marginBottom: 13 },
  moodRow: { flexDirection: "row", gap: 4, paddingTop: 10 },
  moodChoice: { alignItems: "center", gap: 4, width: 58 },
  moodIcon: {
    width: 30,
    height: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  moodEmoji: { fontSize: 17 },
  moodLabel: { color: colors.muted, fontSize: 10, textAlign: "center" },
  quickHeading: { marginTop: 1, marginBottom: 8 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    padding: 11,
    marginBottom: 10,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: 13, fontWeight: "600" },
  actionSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  crisisCard: {
    minHeight: 110,
    backgroundColor: "#FF797B",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginBottom: 15,
  },
  crisisIcon: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  crisisTitle: { color: colors.white, fontSize: 15, fontWeight: "700" },
  crisisSub: {
    color: colors.white,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  progressCard: { padding: 12, marginBottom: 13 },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakPill: {
    borderWidth: 1,
    borderColor: colors.teal,
    backgroundColor: colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  streakText: { color: colors.tealDark, fontSize: 11, fontWeight: "600" },
  sessionCount: { color: colors.muted, fontSize: 11 },
  trendLabel: { color: colors.muted, fontSize: 12, marginTop: 11 },
  chartRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 7,
  },
  chartColumn: { alignItems: "center", justifyContent: "flex-end", gap: 4 },
  chartBar: { width: 9, borderRadius: 6, backgroundColor: "#77B6A7" },
  chartDay: { color: colors.muted, fontSize: 11 },
  emptyTrend: {
    color: colors.muted,
    fontSize: 12,
    alignSelf: "center",
    paddingBottom: 14,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    marginBottom: 14,
  },
  sessionIcon: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionCopy: { flex: 1, gap: 3 },
  sessionTitle: { color: colors.text, fontSize: 12, fontWeight: "600" },
  sessionSub: { color: colors.muted, fontSize: 11 },
  supportHeading: { marginTop: 1, marginBottom: 8 },
  supportRow: { flexDirection: "row", gap: 7, marginBottom: 14 },
  supportCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 94,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 8,
  },
  supportIcon: {
    width: 30,
    height: 30,
    borderRadius: 17,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  supportTitle: { color: colors.text, fontSize: 12, fontWeight: "600" },
  supportSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  pressed: { opacity: 0.82 },
});
