import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { studentDisplayName } from "../../lib/student-privacy";
import type { Appointment } from "../../types";

type QueueFilter = "all" | "pending" | "confirmed";

export default function CounselorSessions() {
  const { currentUser, state, respondToAppointmentRequest } = useApp();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const filter: QueueFilter =
    tabParam === "pending" || tabParam === "confirmed" ? tabParam : "all";
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const queue = state.appointments
    .filter(
      (appointment) =>
        appointment.counselorId === currentUser?.id &&
        ["pending", "upcoming"].includes(appointment.status),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const pendingCount = queue.filter(
    (appointment) => appointment.status === "pending",
  ).length;
  const confirmedCount = queue.filter(
    (appointment) => appointment.status === "upcoming",
  ).length;
  const dates = useMemo(() => {
    const queueDates = Array.from(
      new Set(queue.map((appointment) => appointment.date)),
    ).sort();
    if (queueDates.length) return queueDates.slice(0, 5);
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return localDateKey(date);
    });
  }, [queue]);
  const visible = queue.filter((appointment) => {
    const statusMatches =
      filter === "all" ||
      (filter === "pending"
        ? appointment.status === "pending"
        : appointment.status === "upcoming");
    return (
      statusMatches && (!selectedDate || appointment.date === selectedDate)
    );
  });

  const accept = (appointment: Appointment) =>
    respondToAppointmentRequest(appointment.id, "upcoming");
  const decline = (appointment: Appointment) =>
    respondToAppointmentRequest(appointment.id, "cancelled");

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.jpg")}
            style={styles.headerMark}
            accessibilityLabel="MindCare logo"
          />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Appointment Requests &amp; Queue</Text>
            <Text style={styles.subtitle}>
              Manage student bookings, approve sessions, or reschedule times.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/notifications")}
            style={styles.noticeButton}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={15}
              color={colors.tealDark}
            />
          </Pressable>
        </View>

        <View style={styles.dateStrip}>
          {dates.map((date) => {
            const parsed = new Date(`${date}T12:00:00`);
            const selected = selectedDate === date;
            return (
              <Pressable
                key={date}
                onPress={() => setSelectedDate(selected ? null : date)}
                style={styles.dateItem}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.dateDay}>
                  {parsed.toLocaleDateString(undefined, { weekday: "short" })}
                </Text>
                <View
                  style={[
                    styles.dateNumber,
                    selected && styles.dateNumberSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateNumberText,
                      selected && styles.dateNumberTextSelected,
                    ]}
                  >
                    {parsed.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          <FilterButton
            label={`All (${queue.length})`}
            value="all"
            selected={filter}
            onPress={(value) => router.setParams({ tab: value })}
          />
          <FilterButton
            label={`Pending (${pendingCount})`}
            value="pending"
            selected={filter}
            onPress={(value) => router.setParams({ tab: value })}
          />
          <FilterButton
            label={`Confirmed (${confirmedCount})`}
            value="confirmed"
            selected={filter}
            onPress={(value) => router.setParams({ tab: value })}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Ionicons name="time-outline" size={14} color={colors.tealDark} />
          <Text style={styles.sectionTitle}>
            {filter === "confirmed"
              ? "Confirmed Sessions"
              : filter === "pending"
                ? "Pending Requests (Needs Action)"
                : "Requests & Upcoming Sessions"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.queueList}
        >
          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={colors.teal}
              />
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyText}>
                No sessions match these filters.
              </Text>
            </View>
          ) : (
            visible.map((appointment) => {
              const student = state.users.find(
                (user) => user.id === appointment.userId,
              );
              const anonymous = Boolean(
                appointment.isAnonymous || student?.isAnonymous,
              );
              const studentName = studentDisplayName(
                student,
                appointment.isAnonymous,
              );
              const isPending = appointment.status === "pending";
              const sessionLabel =
                appointment.type === "video"
                  ? "Video Consultation"
                  : appointment.type === "chat"
                    ? "Chat Support"
                    : "In-Person";
              return (
                <View key={appointment.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.studentCopy}>
                      <Text style={styles.studentName}>{studentName}</Text>
                      <Text style={styles.requestDate}>
                        {formatQueueDate(appointment.date)}
                      </Text>
                    </View>
                    <Text style={styles.timeRange}>
                      {formatQueueTime(
                        appointment.time,
                        appointment.durationMin,
                      )}
                    </Text>
                  </View>
                  <View style={styles.sessionType}>
                    <Ionicons
                      name={
                        appointment.type === "video"
                          ? "videocam-outline"
                          : appointment.type === "chat"
                            ? "chatbubble-outline"
                            : "people-outline"
                      }
                      size={13}
                      color={colors.muted}
                    />
                    <Text style={styles.sessionTypeText}>
                      {sessionLabel}
                      {anonymous ? " · Confidential" : ""}
                    </Text>
                  </View>
                  {appointment.notes ? (
                    <Text style={styles.requestNote} numberOfLines={2}>
                      {appointment.notes}
                    </Text>
                  ) : null}
                  {isPending ? (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => accept(appointment)}
                        style={styles.acceptButton}
                        accessibilityRole="button"
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          router.push(`/counselor-reschedule/${appointment.id}`)
                        }
                        style={styles.rescheduleButton}
                        accessibilityRole="button"
                      >
                        <Text style={styles.rescheduleText}>Reschedule</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => decline(appointment)}
                        style={styles.declineButton}
                        accessibilityRole="button"
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() =>
                        router.push(`/counselor-appoinment/${appointment.id}`)
                      }
                      style={styles.detailsButton}
                      accessibilityRole="button"
                    >
                      <Text style={styles.detailsText}>Open Session</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

function FilterButton({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: QueueFilter;
  selected: QueueFilter;
  onPress: (value: QueueFilter) => void;
}) {
  const active = selected === value;
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[styles.filterPill, active && styles.filterPillActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatQueueDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatQueueTime(time: string, duration: number) {
  const [hour, minute] = time.split(":").map(Number);
  const end = new Date();
  end.setHours(hour, minute + duration, 0, 0);
  return `${formatTimeShort(time)} - ${formatTimeShort(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`)}`;
}

function formatTimeShort(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
  },
  headerMark: {
    width: 31,
    height: 28,
    borderRadius: 6,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: "#397E72", fontSize: 15, fontWeight: "700" },
  subtitle: {
    color: "#53645F",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  noticeButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  dateItem: { flex: 1, alignItems: "center", gap: 3 },
  dateDay: { color: "#53645F", fontSize: 12, fontWeight: "600" },
  dateNumber: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
  },
  dateNumberSelected: { backgroundColor: "#D7EEE7", borderColor: "#55A998" },
  dateNumberText: { color: colors.text, fontSize: 13 },
  dateNumberTextSelected: { color: colors.tealDark, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 4, marginBottom: 11 },
  filterPill: {
    minHeight: 21,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  filterPillActive: { borderColor: "#58A998", backgroundColor: "#E4F3EE" },
  filterText: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: colors.tealDark, fontWeight: "700" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 7,
  },
  sectionTitle: { color: "#397E72", fontSize: 14, fontWeight: "700" },
  queueList: { gap: 8, paddingBottom: 12 },
  requestCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: "#183C34",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 5,
  },
  studentCopy: { flex: 1, gap: 2 },
  studentName: { color: "#397E72", fontSize: 14, fontWeight: "700" },
  requestDate: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  timeRange: {
    color: "#667A73",
    fontSize: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  sessionTypeText: { color: "#53645F", fontSize: 13, fontWeight: "500" },
  requestNote: { color: "#60736D", fontSize: 14, lineHeight: 18, marginTop: 7 },
  actionRow: { flexDirection: "row", gap: 5, marginTop: 7 },
  acceptButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#5BA48F",
  },
  acceptText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  rescheduleButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
  },
  rescheduleText: { color: "#4F615B", fontSize: 14, fontWeight: "500" },
  declineButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#F7C8A9",
  },
  declineText: { color: "#8D5841", fontSize: 14, fontWeight: "700" },
  detailsButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
  },
  detailsText: { color: colors.tealDark, fontSize: 14, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 28, gap: 5 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  emptyText: { color: "#53645F", fontSize: 14, fontWeight: "500" },
});
