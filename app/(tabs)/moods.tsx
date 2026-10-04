import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { moodMeta, moodsByUser } from "../../lib/format";
import type { MoodEntry } from "../../types";

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

export default function Moods() {
  const { currentUser, state } = useApp();
  const entries = currentUser ? moodsByUser(state.moods, currentUser.id) : [];
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const calendarDays = Array.from(
    { length: cellCount },
    (_, index) => new Date(year, month, index - leadingDays + 1),
  );
  const entriesByDay = new Map<string, MoodEntry>();
  for (const entry of entries) {
    const key = localDayKey(new Date(entry.createdAt));
    if (!entriesByDay.has(key)) entriesByDay.set(key, entry);
  }
  const goodDays = entries.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      (entry.mood === "good" || entry.mood === "great")
    );
  }).length;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
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
            size={32}
            profileType="student"
            profileImage={currentUser?.profileImage}
          />
        </Pressable>
      </View>

      <Text style={styles.title}>Mood Calendar</Text>
      <Text style={styles.subtitle}>Your emotional journey this month</Text>

      <View style={styles.monthHeading}>
        <Text style={styles.monthTitle}>
          {visibleMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <View style={styles.monthControls}>
          <Pressable
            onPress={() => setVisibleMonth(new Date(year, month - 1, 1))}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={17} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => setVisibleMonth(new Date(year, month + 1, 1))}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekdays}>
          {weekdays.map((weekday, index) => (
            <Text key={`${weekday}-${index}`} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((date) => {
            const entry = entriesByDay.get(localDayKey(date));
            const inMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <View key={localDayKey(date)} style={styles.dayCellWrap}>
                <Pressable
                  disabled={!entry}
                  onPress={() => entry && router.push(`/mood/${entry.id}`)}
                  style={[
                    styles.dayCell,
                    !inMonth && styles.outsideDay,
                    isToday && styles.todayCell,
                  ]}
                  accessibilityRole={entry ? "button" : undefined}
                  accessibilityLabel={`${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${entry ? `, ${moodMeta(entry.mood).label}` : ""}`}
                >
                  <Text style={styles.dayNumber}>{date.getDate()}</Text>
                  <Text style={styles.dayMood}>
                    {entry ? moodMeta(entry.mood).emoji : ""}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsCopy}>
          <Text style={styles.statsTitle}>
            {visibleMonth.toLocaleDateString(undefined, { month: "long" })}{" "}
            stats
          </Text>
          <Text style={styles.statsSubtitle}>
            {goodDays} Good or Great days logged
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/trends")}
          style={styles.trendsButton}
        >
          <Text style={styles.trendsText}>View Trends</Text>
          <Ionicons name="arrow-forward" size={14} color="#4D9E8C" />
        </Pressable>
      </View>
    </Screen>
  );
}

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingRight: 10,
  },
  backText: { color: "#3F514B", fontSize: 14, fontWeight: "600" },
  title: { color: "#28695E", fontSize: 25, fontWeight: "800" },
  subtitle: {
    color: "#465752",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 20,
  },
  monthHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthTitle: { color: "#28695E", fontSize: 19, fontWeight: "700" },
  monthControls: { flexDirection: "row", gap: 8 },
  monthButton: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
  },
  weekdays: { flexDirection: "row", marginBottom: 4 },
  weekday: {
    width: "14.2857%",
    color: "#465752",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 5,
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCellWrap: { width: "14.2857%", padding: 2 },
  dayCell: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  outsideDay: { opacity: 0.48 },
  todayCell: { backgroundColor: colors.mint, borderColor: colors.teal },
  dayNumber: { color: "#344640", fontSize: 14, fontWeight: "600" },
  dayMood: { minHeight: 14, fontSize: 13 },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    padding: 14,
  },
  statsCopy: { flex: 1, gap: 5 },
  statsTitle: { color: "#28695E", fontSize: 14, fontWeight: "700" },
  statsSubtitle: { color: "#465752", fontSize: 13, fontWeight: "500" },
  trendsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#7EBAA9",
    backgroundColor: "#ECF7F3",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trendsText: { color: "#28695E", fontSize: 13, fontWeight: "700" },
});
