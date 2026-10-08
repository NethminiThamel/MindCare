import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar, Screen } from "../../components/ui";
import { colors, type MoodKey } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { moodMeta, moodsByUser } from "../../lib/format";

const checkinMoods: { key: MoodKey; label: string; emoji: string }[] = [
  { key: "great", label: "Great", emoji: "🤩" },
  { key: "good", label: "Good", emoji: "🙂" },
  { key: "okay", label: "Okay", emoji: "😐" },
  { key: "sad", label: "Low", emoji: "😔" },
  { key: "stressed", label: "Struggling", emoji: "😢" },
];

export default function CheckIn() {
  const { currentUser, state, addMood, deleteMood } = useApp();
  const [mood, setMood] = useState<MoodKey>();
  const [stress, setStress] = useState(4);
  const [note, setNote] = useState("");
  const [moodError, setMoodError] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setMoodError(null);
    }, []),
  );
  const entries = currentUser ? moodsByUser(state.moods, currentUser.id) : [];
  const deleteEntry = entries.find((entry) => entry.id === deleteEntryId);
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - 6 + index);
    const entry = entries.find(
      (item) => new Date(item.createdAt).toDateString() === date.toDateString(),
    );
    return { date, entry };
  });
  const stressPosition: `${number}%` = `${((stress - 1) / 9) * 100}%`;

  const updateStressFromX = (locationX: number) => {
    setStress(
      Math.max(1, Math.min(10, Math.round((locationX / sliderWidth) * 9) + 1)),
    );
  };
  const [sliderWidth, setSliderWidth] = useState(1);

  const submit = () => {
    if (!mood) {
      setMoodError("Please choose a mood before submitting your check-in.");
      return;
    }
    addMood({ mood, stressLevel: stress, note: note.trim() });
    setMood(undefined);
    setNote("");
    router.push("/(tabs)/moods");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.navigate("/(tabs)")}
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

      <Text style={styles.title}>Mood Check-in</Text>
      <Text style={styles.subtitle}>
        Log your mental state for self-reflection
      </Text>

      <View style={styles.moodCard}>
        <Text style={styles.question}>How are you feeling today?</Text>
        <View style={styles.moodRow}>
          {checkinMoods.map((option) => {
            const selected = mood === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  setMoodError(null);
                  setMood(option.key);
                }}
                style={[styles.moodOption, selected && styles.moodSelected]}
                accessibilityRole="button"
                accessibilityLabel={`Mood: ${option.label}`}
                accessibilityState={{ selected }}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selected && styles.moodLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {moodError ? (
          <Text style={styles.moodError} accessibilityRole="alert">
            {moodError}
          </Text>
        ) : null}
      </View>

      <View style={styles.stressHeading}>
        <Text style={styles.stressTitle}>Stress Level</Text>
        <Text style={styles.stressValue}>{stress} / 10</Text>
      </View>
      <View
        style={styles.sliderHitArea}
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) =>
          updateStressFromX(event.nativeEvent.locationX)
        }
        onResponderMove={(event) =>
          updateStressFromX(event.nativeEvent.locationX)
        }
        accessibilityRole="adjustable"
        accessibilityLabel="Stress level"
        accessibilityValue={{ min: 1, max: 10, now: stress }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment")
            setStress((value) => Math.min(10, value + 1));
          if (event.nativeEvent.actionName === "decrement")
            setStress((value) => Math.max(1, value - 1));
        }}
      >
        <View style={styles.sliderTrack}>
          <LinearGradient
            colors={["#C6B4E5", "#5DAA91"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.sliderFill, { width: stressPosition }]}
          />
          <View style={[styles.sliderThumb, { left: stressPosition }]} />
        </View>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderCaption}>Very Calm</Text>
        <Text style={styles.sliderCaption}>Extreme Stress</Text>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Write down any thoughts, feelings, or what triggered this mood..."
        placeholderTextColor="#AABAB5"
        multiline
        textAlignVertical="top"
        style={styles.noteInput}
        accessibilityLabel="Optional mood note"
      />

      <Pressable
        onPress={submit}
        style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
      >
        <Text style={styles.submitText}>Submit Check-in</Text>
      </Pressable>

      <View style={styles.weekCard}>
        <View style={styles.weekHeading}>
          <Text style={styles.weekTitle}>Your mood this week</Text>
          <Pressable onPress={() => router.push("/(tabs)/trends")}>
            <Text style={styles.trendsLink}>View Trends →</Text>
          </Pressable>
        </View>
        <View style={styles.weekChart}>
          {week.map(({ date, entry }) => (
            <View key={date.toISOString()} style={styles.weekColumn}>
              <Text style={styles.weekEmoji}>
                {entry ? moodMeta(entry.mood).emoji : ""}
              </Text>
              <View
                style={[
                  styles.weekBar,
                  { height: entry ? 8 + entry.stressLevel * 3 : 8 },
                ]}
              />
              <Text style={styles.weekDay}>
                {date.toLocaleDateString(undefined, { weekday: "narrow" })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.recentHeading}>
        <Text style={styles.weekTitle}>Recent Check-ins</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/moods")}
          accessibilityRole="button"
        >
          <Text style={styles.trendsLink}>View all</Text>
        </Pressable>
      </View>
      {entries.slice(0, 3).map((entry) => {
        const meta = moodMeta(entry.mood);
        const createdAt = new Date(entry.createdAt);
        return (
          <View key={entry.id} style={styles.recentRow}>
            <View style={styles.recentMood}>
              <Text style={styles.recentEmoji}>{meta.emoji}</Text>
              <View style={styles.recentCopy}>
                <Text style={styles.recentTitle}>
                  {meta.label} · Stress {entry.stressLevel}/10
                </Text>
                <Text style={styles.recentDate}>
                  {createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  ·{" "}
                  {createdAt.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
                {entry.note ? (
                  <Text style={styles.recentNote} numberOfLines={1}>
                    {entry.note}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.recentActions}>
              <Pressable
                onPress={() => router.push(`/mood/${entry.id}`)}
                style={styles.entryAction}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${meta.label} check-in`}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={colors.tealDark}
                />
              </Pressable>
              <Pressable
                onPress={() => setDeleteEntryId(entry.id)}
                style={styles.entryAction}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${meta.label} check-in`}
              >
                <Ionicons name="trash-outline" size={14} color={colors.coral} />
              </Pressable>
            </View>
          </View>
        );
      })}

      <Modal
        transparent
        visible={!!deleteEntry}
        animationType="fade"
        onRequestClose={() => setDeleteEntryId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Delete this check-in?</Text>
            <Text style={styles.confirmBody}>
              This mood entry will be removed from your history.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setDeleteEntryId(null)}
                style={styles.keepButton}
                accessibilityRole="button"
              >
                <Text style={styles.keepText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (deleteEntry) deleteMood(deleteEntry.id);
                  setDeleteEntryId(null);
                }}
                style={styles.confirmDeleteButton}
                accessibilityRole="button"
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
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
  backText: { color: colors.muted, fontSize: 14 },
  title: { color: "#397E72", fontSize: 25, fontWeight: "700" },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
  },
  moodCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  question: {
    color: "#397E72",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  moodRow: { flexDirection: "row", gap: 7, justifyContent: "space-between" },
  moodOption: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 28,
  },
  moodSelected: { borderColor: colors.line, backgroundColor: "#FBFDFC" },
  moodEmoji: { fontSize: 22 },
  moodLabel: { color: colors.muted, fontSize: 12, textAlign: "center" },
  moodLabelSelected: { color: "#397E72" },
  moodError: { color: colors.coral, fontSize: 13, marginTop: 8 },
  stressHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  stressTitle: { color: "#33433F", fontSize: 15, fontWeight: "600" },
  stressValue: { color: "#4E9C8D", fontSize: 15, fontWeight: "700" },
  sliderHitArea: { height: 38, justifyContent: "center", marginTop: 5 },
  sliderTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#E4F1ED",
    justifyContent: "center",
  },
  sliderFill: { height: 4, borderRadius: 3, overflow: "hidden" },
  sliderThumb: {
    position: "absolute",
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: "#5BA48F",
    elevation: 2,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sliderCaption: { color: colors.muted, fontSize: 12 },
  noteInput: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 14,
  },
  submit: {
    minHeight: 48,
    borderRadius: 28,
    backgroundColor: "#5BA48F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  pressed: { opacity: 0.82 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  weekCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  weekHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekTitle: { color: "#397E72", fontSize: 14, fontWeight: "600" },
  trendsLink: { color: "#4D9E8C", fontSize: 12 },
  weekChart: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  weekColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  weekEmoji: { minHeight: 12, fontSize: 12 },
  weekBar: { width: 10, borderRadius: 6, backgroundColor: "#73B5A3" },
  weekDay: { color: colors.muted, fontSize: 11 },
  recentHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  recentRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  recentMood: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentEmoji: { width: 28, textAlign: "center", fontSize: 19 },
  recentCopy: { flex: 1, minWidth: 0, gap: 2 },
  recentTitle: { color: colors.text, fontSize: 12, fontWeight: "600" },
  recentDate: { color: colors.muted, fontSize: 11 },
  recentNote: { color: colors.muted, fontSize: 11 },
  recentActions: { flexDirection: "row", gap: 3 },
  entryAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#F1F6F4",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(17, 39, 34, 0.35)",
  },
  confirmDialog: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  confirmTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  confirmBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    marginTop: 6,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  keepButton: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
  },
  keepText: { color: colors.tealDark, fontSize: 12, fontWeight: "600" },
  confirmDeleteButton: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.coral,
  },
  confirmDeleteText: { color: colors.white, fontSize: 12, fontWeight: "600" },
});
