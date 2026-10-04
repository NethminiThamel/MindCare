import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { formatTime } from '../../../lib/format';
import type { AppointmentType } from '../../../types';

const times = ['09:00', '10:30', '14:00', '16:30'];
const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const sessionTypes: { key: AppointmentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'video', label: 'Video Call', icon: 'videocam-outline' },
  { key: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline' },
  { key: 'in-person', label: 'In-Person', icon: 'location-outline' },
];

export default function Booking() {
  const { id, time: timeParam } = useLocalSearchParams<{ id: string; time?: string }>();
  const { currentUser, state, bookAppointment } = useApp();
  const counselor = state.counselors.find((item) => item.id === id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [date, setDate] = useState(() => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    return toDateKey(nextDay);
  });
  const time = times.includes(timeParam ?? '') ? timeParam ?? '10:30' : '10:30';
  const [type, setType] = useState<AppointmentType>('video');
  const calendarDays = buildCalendarDays(month);
  const calendarWeeks = Array.from({ length: calendarDays.length / 7 }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7)
  );
  const todayKey = toDateKey(today);
  const selectedDay = new Date(`${date}T12:00:00`);
  const previousMonthDisabled = month.getFullYear() === today.getFullYear() && month.getMonth() <= today.getMonth();

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
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={currentUser?.name ?? 'Student'} color={currentUser?.avatarColor ?? colors.teal} size={30} />
          </Pressable>
        </View>

        <Text style={styles.title}>Book a Session</Text>
        <Text style={styles.subtitle}>Schedule therapy at your convenience</Text>

        <View style={styles.counselorCard}>
          <Avatar name={counselor.name} color={counselor.avatarColor} size={42} />
          <View style={styles.counselorInfo}>
            <Text style={styles.name} numberOfLines={1}>{counselor.name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{counselor.specialties[0]} Specialist</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable
              onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              disabled={previousMonthDisabled}
              style={styles.monthArrow}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={13} color={previousMonthDisabled ? '#BCCAC6' : colors.tealDark} />
            </Pressable>
            <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <Pressable
              onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              style={styles.monthArrow}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={13} color={colors.tealDark} />
            </Pressable>
          </View>
          <View style={styles.weekdayRow}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
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
                      if (!inMonth) setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                    }}
                    disabled={disabled}
                    style={[styles.calendarCell, selected && styles.calendarCellSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    accessibilityState={{ selected, disabled }}
                  >
                    <Text style={[styles.calendarDay, !inMonth && styles.outsideMonth, disabled && styles.disabledDay, selected && styles.selectedText]}>
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
          <Text style={styles.selectedDate}>{selectedDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        </View>

        <View style={styles.timeRow}>
          {times.map((slot) => {
            const selected = time === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => router.setParams({ time: slot })}
                style={[styles.timeChip, selected && styles.selectedChip]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${formatTime(slot)}`}
              >
                <Text style={[styles.timeText, selected && styles.selectedText]}>{formatTime(slot)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sessionTypeHeading]}>SESSION TYPE</Text>
        <View style={styles.formatRow}>
          {sessionTypes.map((option) => {
            const selected = type === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setType(option.key)}
                style={[styles.formatChip, selected && styles.selectedChip]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.formatText, selected && styles.selectedText]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            const appointment = bookAppointment({ counselorId: counselor.id, date, time, type, notes: '' });
            router.replace({
              pathname: '/done',
              params: {
                appointmentId: appointment.id,
              },
            });
          }}
          style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.bookText}>Confirm Booking</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: { color: '#397E72', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#657873', fontSize: 13, marginTop: 4, marginBottom: 13 },
  counselorCard: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#AFC2BC',
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  counselorInfo: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: '#344A45', fontSize: 14, fontWeight: '600' },
  specialty: { color: '#7B8D88', fontSize: 12 },
  calendarCard: { marginTop: 10, padding: 7, borderWidth: 1, borderColor: '#AFC2BC', borderRadius: 11, backgroundColor: colors.white, shadowColor: '#183C34', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  monthHeader: { height: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  monthArrow: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { color: '#536A64', fontSize: 12, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 2 },
  weekday: { flex: 1, color: '#687C76', fontSize: 11, textAlign: 'center', lineHeight: 17 },
  calendarWeek: { flexDirection: 'row' },
  calendarCell: { flex: 1, aspectRatio: 1.55, minHeight: 21, maxHeight: 25, alignItems: 'center', justifyContent: 'center', margin: 1, borderWidth: 1, borderColor: '#D8E3DF', borderRadius: 7, backgroundColor: colors.white },
  calendarCellSelected: { borderColor: '#55A889', backgroundColor: '#E3F2EB' },
  calendarDay: { color: '#586C66', fontSize: 11 },
  outsideMonth: { color: '#A7B4B0' },
  disabledDay: { color: '#CCD5D2' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 6 },
  sectionLabel: { color: '#687C76', fontSize: 12, fontWeight: '600' },
  selectedDate: { color: colors.muted, fontSize: 12 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  timeChip: { minHeight: 27, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  timeText: { color: '#657873', fontSize: 12 },
  selectedChip: { borderColor: '#72B7A5', backgroundColor: '#E7F4F0' },
  selectedText: { color: '#4E9C8D' },
  sessionTypeHeading: { marginTop: 12, marginBottom: 5 },
  formatRow: { flexDirection: 'row', gap: 5 },
  formatChip: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  formatText: { color: '#657873', fontSize: 11 },
  bookButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 24, backgroundColor: '#5BA48F', elevation: 3 },
  bookText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  notFound: { color: colors.text, fontSize: 14 },
});

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - offset + 1)
  );
}