import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { Avatar, Card, Screen } from "../../components/ui";
import { colors, type MoodKey } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { moodsByUser } from "../../lib/format";
import type { MoodEntry } from "../../types";

type Mode = "weekly" | "monthly";
type EmotionGroup = {
  label: string;
  emoji: string;
  moods: MoodKey[];
  color: string;
};

const emotions: EmotionGroup[] = [
  { label: "Great", emoji: "🤩", moods: ["great"], color: "#4F9A87" },
  { label: "Good", emoji: "🙂", moods: ["good"], color: "#7DB9AE" },
  { label: "Okay", emoji: "😐", moods: ["okay"], color: "#F2B49A" },
  { label: "Low", emoji: "😔", moods: ["sad"], color: "#A8DBCF" },
  {
    label: "Struggling",
    emoji: "😢",
    moods: ["anxious", "stressed"],
    color: "#CADDD6",
  },
];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Trends() {
  const { currentUser, state } = useApp();
  const entries = currentUser ? moodsByUser(state.moods, currentUser.id) : [];
  const [mode, setMode] = useState<Mode>("weekly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = new Date();
  const weekStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weeklyEntries = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return createdAt >= weekStart && createdAt < weekEnd;
  });
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date,
      entry: weeklyEntries.find(
        (entry) =>
          new Date(entry.createdAt).toDateString() === date.toDateString(),
      ),
    };
  });

  const monthChoices = Array.from(
    { length: 5 },
    (_, index) =>
      new Date(today.getFullYear(), today.getMonth() - 4 + index, 1),
  );
  const trendMonths = Array.from(
    { length: 6 },
    (_, index) =>
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 5 + index,
        1,
      ),
  );
  const quarterStart = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() - 2,
    1,
  );
  const quarterEnd = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1,
  );
  const monthlyEntries = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return createdAt >= quarterStart && createdAt < quarterEnd;
  });
  const emotionCounts = countEmotions(
    mode === "weekly" ? weeklyEntries : monthlyEntries,
  );
  const monthlySeries = emotions.map((emotion) => ({
    ...emotion,
    values: trendMonths.map((month) =>
      countEmotionsForMonth(entries, month, emotion.moods),
    ),
  }));
  const maxMonthlyCount = Math.max(
    1,
    ...monthlySeries.flatMap((series) => series.values),
  );
  const visibleMonth = monthChoices.some(
    (month) =>
      month.getFullYear() === selectedMonth.getFullYear() &&
      month.getMonth() === selectedMonth.getMonth(),
  );

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

      <Text style={styles.title}>Mood Trends</Text>
      <Text style={styles.subtitle}>
        Deeper emotional analytics &amp; patterns
      </Text>

      <View style={styles.segment}>
        <Segment
          label="Weekly"
          selected={mode === "weekly"}
          onPress={() => setMode("weekly")}
        />
        <Segment
          label="Monthly"
          selected={mode === "monthly"}
          onPress={() => setMode("monthly")}
        />
      </View>

      {mode === "weekly" ? (
        <>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Weekly Mental Path</Text>
            <View style={styles.weeklyChart}>
              {week.map(({ date, entry }) => (
                <View key={date.toISOString()} style={styles.dayColumn}>
                  <Text style={styles.dayEmoji}>
                    {entry ? emotionForMood(entry.mood).emoji : ""}
                  </Text>
                  <View
                    style={[
                      styles.weekBar,
                      { height: entry ? 10 + entry.stressLevel * 4 : 10 },
                    ]}
                  />
                  <Text style={styles.dayLabel}>
                    {date.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
          <EmotionFrequency counts={emotionCounts} title="Emotion Frequency" />
        </>
      ) : (
        <>
          <Card style={styles.monthlyCard}>
            <View style={styles.monthChips}>
              {monthChoices.map((month) => {
                const selected =
                  month.getFullYear() === selectedMonth.getFullYear() &&
                  month.getMonth() === selectedMonth.getMonth();
                return (
                  <Pressable
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    onPress={() => setSelectedMonth(month)}
                    style={[
                      styles.monthChip,
                      selected && styles.monthChipSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.monthChipText,
                        selected && styles.monthChipTextSelected,
                      ]}
                    >
                      {monthNames[month.getMonth()]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!visibleMonth ? (
              <View style={styles.monthNavigation}>
                <Pressable
                  onPress={() =>
                    setSelectedMonth(
                      new Date(
                        selectedMonth.getFullYear(),
                        selectedMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
                <Text style={styles.chartTitle}>3-Month Mood Trends</Text>
                <Pressable
                  onPress={() =>
                    setSelectedMonth(
                      new Date(
                        selectedMonth.getFullYear(),
                        selectedMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            ) : (
              <Text style={styles.chartTitle}>3-Month Mood Trends</Text>
            )}

            <View style={styles.emotionAxis}>
              {emotions.map((emotion) => (
                <Text key={emotion.label} style={styles.axisLabel}>
                  {emotion.label}
                </Text>
              ))}
            </View>
            <Svg
              width="100%"
              height={150}
              viewBox="0 0 300 150"
              preserveAspectRatio="none"
            >
              {[18, 42, 66, 90, 114].map((y) => (
                <Line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="300"
                  y2={y}
                  stroke="#DCE9E5"
                  strokeWidth="1"
                />
              ))}
              {monthlySeries.map((series) => {
                const path = smoothPath(series.values, maxMonthlyCount);
                return (
                  <Path
                    key={series.label}
                    d={path}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2"
                  />
                );
              })}
              {monthlySeries.flatMap((series) =>
                series.values.map((value, index) => {
                  const x = 8 + (index * 284) / 5;
                  const y = 128 - (value / maxMonthlyCount) * 108;
                  return (
                    <Circle
                      key={`${series.label}-${index}`}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill={series.color}
                    />
                  );
                }),
              )}
            </Svg>
            <View style={styles.chartMonths}>
              {trendMonths.map((month) => (
                <Text
                  key={`${month.getFullYear()}-${month.getMonth()}`}
                  style={styles.chartMonthLabel}
                >
                  {monthNames[month.getMonth()]}
                </Text>
              ))}
            </View>
          </Card>
          <EmotionFrequency
            counts={emotionCounts}
            title="3-Month Emotion Frequency"
          />
        </>
      )}
    </Screen>
  );
}

function Segment({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentItem, selected && styles.segmentItemSelected]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
    >
      <Text
        style={[styles.segmentText, selected && styles.segmentTextSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmotionFrequency({
  counts,
  title,
}: {
  counts: { label: string; emoji: string; color: string; count: number }[];
  title: string;
}) {
  const maxCount = Math.max(1, ...counts.map((item) => item.count));
  return (
    <Card style={styles.frequencyCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.frequencyRows}>
        {counts.map((item) => {
          const fill: `${number}%` = `${(item.count / maxCount) * 100}%`;
          return (
            <View key={item.label} style={styles.frequencyRow}>
              <Text style={styles.frequencyEmoji}>{item.emoji}</Text>
              <Text style={styles.frequencyLabel}>{item.label}</Text>
              <View style={styles.frequencyTrack}>
                <View
                  style={[
                    styles.frequencyFill,
                    { width: fill, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.frequencyCount}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function countEmotions(entries: MoodEntry[]) {
  return emotions.map((emotion) => ({
    ...emotion,
    count: entries.filter((entry) => emotion.moods.includes(entry.mood)).length,
  }));
}

function countEmotionsForMonth(
  entries: MoodEntry[],
  month: Date,
  moods: MoodKey[],
) {
  return entries.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date.getFullYear() === month.getFullYear() &&
      date.getMonth() === month.getMonth() &&
      moods.includes(entry.mood)
    );
  }).length;
}

function emotionForMood(mood: MoodKey) {
  return (
    emotions.find((emotion) => emotion.moods.includes(mood)) ?? emotions[2]
  );
}

function smoothPath(values: number[], maxValue: number) {
  const points = values.map((value, index) => ({
    x: 8 + (index * 284) / Math.max(values.length - 1, 1),
    y: 128 - (value / maxValue) * 108,
  }));
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const middle = (previous.x + current.x) / 2;
    path += ` C ${middle} ${previous.y}, ${middle} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingRight: 10,
  },
  backText: { color: colors.muted, fontSize: 14 },
  title: {
    color: "#254C47",
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 20,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  segmentItemSelected: { borderBottomColor: "#5EB8A8" },
  segmentText: { color: colors.muted, fontSize: 15, fontWeight: "500" },
  segmentTextSelected: { color: "#348273", fontWeight: "600" },
  chartCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 14,
  },
  cardTitle: { color: "#2C6C62", fontSize: 15, fontWeight: "600" },
  weeklyChart: {
    height: 122,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 10,
    gap: 6,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  dayEmoji: {
    height: 18,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  weekBar: {
    width: 14,
    minHeight: 18,
    maxHeight: 62,
    borderRadius: 999,
    backgroundColor: "#9BCFC3",
  },
  dayLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  frequencyCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 14,
  },
  frequencyRows: { gap: 10, marginTop: 12 },
  frequencyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  frequencyEmoji: { width: 18, fontSize: 15 },
  frequencyLabel: { width: 60, color: colors.muted, fontSize: 12 },
  frequencyTrack: {
    height: 9,
    flex: 1,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#E4F1ED",
  },
  frequencyFill: { height: "100%", borderRadius: 999 },
  frequencyCount: {
    width: 18,
    textAlign: "right",
    color: "#31423D",
    fontSize: 12,
    fontWeight: "600",
  },
  monthlyCard: { borderRadius: 16, padding: 14, marginBottom: 14 },
  monthChips: { flexDirection: "row", gap: 6, marginBottom: 14 },
  monthChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 8,
  },
  monthChipSelected: { borderColor: "#4F9A87", backgroundColor: "#E8F5F1" },
  monthChipText: { color: colors.muted, fontSize: 12 },
  monthChipTextSelected: { color: "#397E72", fontWeight: "600" },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartTitle: {
    color: "#397E72",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },
  emotionAxis: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { color: colors.muted, fontSize: 11 },
  chartMonths: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 2,
  },
  chartMonthLabel: { color: colors.muted, fontSize: 11 },
});
