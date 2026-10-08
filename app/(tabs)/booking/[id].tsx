import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Screen } from "../../../components/ui";
import { colors } from "../../../constants/theme";
import { useApp } from "../../../context/AppContext";
import { getAvailabilityTimes } from "../../../lib/availability";
import { formatTime } from "../../../lib/format";
import type { AppointmentType } from "../../../types";

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
const sessionTypes: {
  key: AppointmentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "video", label: "Video Call", icon: "videocam-outline" },
  { key: "chat", label: "Chat", icon: "chatbubble-ellipses-outline" },
  { key: "in-person", label: "In-Person", icon: "location-outline" },
];

export default function Booking() {
  const { id, time: timeParam } = useLocalSearchParams<{ id: string; time?: string }>();
  const { currentUser, ready, state, bookAppointment } = useApp();
  const counselor = state.counselors.find((item) => item.id === id);
  const availability = state.availabilities?.find(
    (item) => item.counselorId === id,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(timeParam ?? "");
  const [type, setType] = useState<AppointmentType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [conflictedSlots, setConflictedSlots] = useState<string[]>([]);
  const [selectionErrors, setSelectionErrors] = useState<{
    date?: string;
    time?: string;
    type?: string;
    availability?: string;
  }>({});
  const activeFormat = availability?.sessionFormats?.find(
    (format) => format.enabled,
  )?.key;
  const durationMin =
    activeFormat === "urgent"
      ? 15
      : activeFormat === "quick"
        ? 30
        : activeFormat === "standard"
          ? 50
          : 0;
  const deliveryMethods = availability?.deliveryMethods ?? [];
  const selectedType = type && deliveryMethods.includes(type) ? type : undefined;
  const times = date
    ? getAvailabilityTimes(availability, date, durationMin).filter(
        (slot) => !conflictedSlots.includes(`${date}|${slot}`),
      )
    : [];
  const time = times.includes(selectedTime) ? selectedTime : "";
  const calendarDays = buildCalendarDays(month);
  const calendarWeeks = Array.from(
    { length: calendarDays.length / 7 },
    (_, index) => calendarDays.slice(index * 7, index * 7 + 7),
  );
  const todayKey = toDateKey(today);
  const selectedDay = date ? new Date(`${date}T12:00:00`) : null;
  const previousMonthDisabled =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() <= today.getMonth();

  if (!ready) {
    return (
      <Screen>
        <Text style={styles.notFound}>Loading counselor availability...</Text>
      </Screen>
    );
  }

  if (!counselor) {
    return (
      <Screen>
        <Text style={styles.notFound}>Counselor not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
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

        <Text style={styles.title}>Book a Session</Text>
        <Text style={styles.subtitle}>
          Schedule therapy at your convenience
        </Text>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable
              onPress={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              disabled={previousMonthDisabled}
              style={styles.monthArrow}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons
                name="chevron-back"
                size={13}
                color={previousMonthDisabled ? "#BCCAC6" : colors.tealDark}
              />
            </Pressable>
            <Text style={styles.monthTitle}>
              {month.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Pressable
              onPress={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              style={styles.monthArrow}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={13}
                color={colors.tealDark}
              />
            </Pressable>
          </View>
          <View style={styles.weekdayRow}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          {calendarWeeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((day) => {
                const dayKey = toDateKey(day);
                const selected = date === dayKey;
                const disabled = dayKey < todayKey;
                const inMonth = day.getMonth() === month.getMonth();
                return (
                  <Pressable
                    key={dayKey}
                    onPress={() => {
                      setDate(dayKey);
                      setSelectedTime("");
                      setBookingError(null);
                      setSelectionErrors((current) => ({
                        ...current,
                        date: undefined,
                        time: undefined,
                      }));
                      if (!inMonth)
                        setMonth(
                          new Date(day.getFullYear(), day.getMonth(), 1),
                        );
                    }}
                    disabled={
                      disabled ||
                      getAvailabilityTimes(availability, dayKey, durationMin)
                        .length === 0
                    }
                    style={[
                      styles.calendarCell,
                      selected && styles.calendarCellSelected,
                      (disabled ||
                        getAvailabilityTimes(availability, dayKey, durationMin)
                          .length === 0) &&
                        styles.unavailableCell,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={day.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    accessibilityState={{
                      selected,
                      disabled:
                        disabled ||
                        getAvailabilityTimes(availability, dayKey, durationMin)
                          .length === 0,
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDay,
                        !inMonth && styles.outsideMonth,
                        disabled && styles.disabledDay,
                        selected && styles.selectedText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>AVAILABLE TIMES</Text>
          <Text style={styles.selectedDate}>
            {selectedDay
              ? selectedDay.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Choose a date"}
          </Text>
        </View>
        {selectionErrors.date ? (
          <Text style={styles.selectionError} accessibilityRole="alert">
            {selectionErrors.date}
          </Text>
        ) : null}

        <View style={styles.timeRow}>
          {times.map((slot) => {
            const selected = selectedTime === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => {
                  setSelectedTime(slot);
                  setBookingError(null);
                  setSelectionErrors((current) => ({ ...current, time: undefined }));
                }}
                style={[styles.timeChip, selected && styles.selectedChip]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${formatTime(slot)}`}
              >
                <Text
                  style={[styles.timeText, selected && styles.selectedText]}
                >
                  {formatTime(slot)}
                </Text>
              </Pressable>
            );
          })}
          {!times.length ? (
            <Text style={styles.unavailableText}>
              {!date
                ? "Choose a date to see available times."
                : availability?.isAcceptingSessions
                ? "No bookable times are published for this date."
                : "This counselor has not published availability in Firebase."}
            </Text>
          ) : null}
        </View>
        {selectionErrors.time ? (
          <Text style={styles.selectionError} accessibilityRole="alert">
            {selectionErrors.time}
          </Text>
        ) : null}

        <Text style={[styles.sectionLabel, styles.sessionTypeHeading]}>
          SESSION TYPE
        </Text>
        <View style={styles.formatRow}>
          {sessionTypes
            .filter((option) => deliveryMethods.includes(option.key))
            .map((option) => {
              const selected = selectedType === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setType(option.key);
                    setBookingError(null);
                    setSelectionErrors((current) => ({ ...current, type: undefined }));
                  }}
                  style={[styles.formatChip, selected && styles.selectedChip]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.formatText, selected && styles.selectedText]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
        </View>
        {selectionErrors.type ? (
          <Text style={styles.selectionError} accessibilityRole="alert">
            {selectionErrors.type}
          </Text>
        ) : null}
        {selectionErrors.availability ? (
          <Text style={styles.selectionError} accessibilityRole="alert">
            {selectionErrors.availability}
          </Text>
        ) : null}

        {bookingError ? (
          <Text style={styles.bookingError} accessibilityRole="alert">
            {bookingError}
          </Text>
        ) : null}

        <Pressable
          onPress={() => {
            if (isSubmitting) return;
            const errors = {
              date: !date
                ? "Choose an available date."
                : times.length === 0
                  ? "Choose a date with available appointment times."
                  : undefined,
              time: !time ? "Choose an available time." : undefined,
              type: !selectedType
                ? deliveryMethods.length
                  ? "Choose a session type."
                  : "No session types are currently available."
                : undefined,
              availability: durationMin === 0
                ? "This counselor has not published an available session format."
                : undefined,
            };
            setSelectionErrors(errors);
            if (
              Object.values(errors).some(Boolean) ||
              !date ||
              !time ||
              !selectedType ||
              durationMin === 0
            ) {
              return;
            }
            setIsSubmitting(true);
            setBookingError(null);
            void bookAppointment({
              counselorId: counselor.id,
              date,
              time,
              type: selectedType,
              durationMin,
              notes: "",
            })
              .then((appointment) => {
                router.replace({
                  pathname: "/done",
                  params: { appointmentId: appointment.id },
                });
              })
              .catch((error: unknown) => {
                const errorMessage =
                  error instanceof Error ? error.message : "Please try again.";
                const errorCode =
                  typeof error === "object" && error !== null && "code" in error
                    ? String(error.code).toLowerCase()
                    : "";
                const slotConflict =
                  /slot.*(already booked|booked|unavailable)|already booked|booking conflict/i.test(
                    errorMessage,
                  ) || /already-exists|failed-precondition/.test(errorCode);

                if (slotConflict) {
                  setConflictedSlots((current) =>
                    current.includes(`${date}|${time}`)
                      ? current
                      : [...current, `${date}|${time}`],
                  );
                  setSelectedTime("");
                  setBookingError(
                    "That time was just booked by someone else. Please choose another available time.",
                  );
                } else {
                  setBookingError(
                    error instanceof Error
                      ? `Your appointment could not be saved: ${error.message}`
                      : "Your appointment could not be saved. Please try again.",
                  );
                }
              })
              .finally(() => setIsSubmitting(false));
          }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.bookButton,
            isSubmitting && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.bookText}>
            {isSubmitting ? "Saving to Firebase..." : "Confirm Booking"}
          </Text>
        </Pressable>
      </View>
    </Screen>
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
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: { color: "#657873", fontSize: 15, marginTop: 4, marginBottom: 16 },
  calendarCard: {
    marginTop: 2,
    padding: 10,
    borderWidth: 1,
    borderColor: "#B9D3CD",
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: "#0E6A5C",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  monthHeader: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  monthArrow: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: { color: "#536A64", fontSize: 12, fontWeight: "600" },
  weekdayRow: { flexDirection: "row", marginBottom: 2 },
  weekday: {
    flex: 1,
    color: "#687C76",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    fontWeight: "500",
  },
  calendarWeek: { flexDirection: "row", marginTop: 2 },
  calendarCell: {
    flex: 1,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderWidth: 1,
    borderColor: "#D8E3DF",
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  calendarCellSelected: {
    borderColor: "#5AAE9D",
    backgroundColor: "#DFEFEA",
    shadowColor: "#5AAE9D",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  unavailableCell: { opacity: 0.35 },
  calendarDay: { color: "#586C66", fontSize: 11, fontWeight: "500" },
  outsideMonth: { color: "#A7B4B0" },
  disabledDay: { color: "#CCD5D2" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  sectionLabel: { color: "#687C76", fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  selectedDate: { color: colors.muted, fontSize: 12 },
  selectionError: { color: "#B42318", fontSize: 12, marginTop: 4 },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unavailableText: { color: colors.muted, fontSize: 12, paddingVertical: 5 },
  timeChip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  timeText: { color: "#657873", fontSize: 12, fontWeight: "600" },
  selectedChip: { borderColor: "#72B7A5", backgroundColor: "#E7F4F0" },
  selectedText: { color: "#4E9C8D", fontWeight: "700" },
  sessionTypeHeading: { marginTop: 16, marginBottom: 8 },
  formatRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  formatChip: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#CFE1DB",
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  formatText: { color: "#657873", fontSize: 12 },
  bookingError: { color: "#B42318", fontSize: 12, marginTop: 8 },
  bookButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#5BA48F",
    elevation: 2,
  },
  disabledButton: { opacity: 0.5 },
  bookText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.82 },
  notFound: { color: colors.text, fontSize: 14 },
});

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const dayCount = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cellCount = Math.ceil((offset + dayCount) / 7) * 7;
  return Array.from(
    { length: cellCount },
    (_, index) =>
      new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  );
}
