import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { getAvailabilityTimes } from '../../../lib/availability';
import { formatDate, formatTime } from '../../../lib/format';
import type { AppointmentType } from '../../../types';

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const sessionTypes: { key: AppointmentType; label: string }[] = [
  { key: 'video', label: 'Video Call' },
  { key: 'chat', label: 'Chat' },
  { key: 'in-person', label: 'In-Person' },
];

export default function RescheduleSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, ready, state, updateAppointment } = useApp();
  const appointment = state.appointments.find((item) => item.id === id);
  const counselor = appointment
    ? state.counselors.find((item) => item.id === appointment.counselorId)
    : undefined;
  const availability = state.availabilities?.find((item) => item.counselorId === appointment?.counselorId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const initialDate = appointment && appointment.date >= todayKey ? appointment.date : toDateKey(tomorrow);
  const initialDateValue = new Date(`${initialDate}T12:00:00`);
  const [month, setMonth] = useState(() => new Date(initialDateValue.getFullYear(), initialDateValue.getMonth(), 1));
  const [date, setDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState<AppointmentType>(appointment?.type ?? 'video');
  const deliveryMethods = availability?.deliveryMethods ?? [];
  const selectedType = deliveryMethods.includes(type) ? type : deliveryMethods[0];
  const times = getAvailabilityTimes(availability, date, appointment?.durationMin ?? 0)
    .filter((slot) => date !== appointment?.date || slot !== appointment?.time);
  const time = times.includes(selectedTime) ? selectedTime : times[0] ?? '';
  const [reason, setReason] = useState('');
  const calendarDays = buildCalendarDays(month);
  const calendarWeeks = Array.from({ length: calendarDays.length / 7 }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7)
  );
  const previousMonthDisabled = month.getFullYear() === today.getFullYear() && month.getMonth() <= today.getMonth();

  if (!ready) {
    return <Screen><Text style={styles.notFound}>Loading counselor availability...</Text></Screen>;
  }

  if (!appointment || !counselor) {
    return <Screen><Text style={styles.notFound}>Appointment not found.</Text></Screen>;
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

        <Text style={styles.title}>Reschedule a Session</Text>
        <Text style={styles.subtitle}>Schedule therapy at your convenience</Text>

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
            {weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
          </View>
          {calendarWeeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((day) => {
                const dayKey = toDateKey(day);
                const selected = date === dayKey;
                const disabled = dayKey < todayKey
                  || !getAvailabilityTimes(availability, dayKey, appointment.durationMin).some(
                    (slot) => dayKey !== appointment.date || slot !== appointment.time
                  );
                const inMonth = day.getMonth() === month.getMonth();
                return (
                  <Pressable
                    key={dayKey}
                    onPress={() => {
                      setDate(dayKey);
                      setSelectedTime('');
                      if (!inMonth) setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                    }}
                    disabled={disabled}
                    style={[styles.calendarCell, selected && styles.calendarCellSelected, disabled && styles.unavailableCell]}
                    accessibilityRole="button"
                    accessibilityLabel={day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    accessibilityState={{ selected, disabled }}
                  >
                    <Text style={[styles.calendarDay, !inMonth && styles.outsideMonth, disabled && styles.disabledDay, selected && styles.selectedText]}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>AVAILABLE TIMES</Text>
          <Text style={styles.selectedDate}>{formatDate(date)}</Text>
        </View>
        <View style={styles.timeRow}>
          {times.map((slot) => {
            const selected = time === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => setSelectedTime(slot)}
                style={[styles.timeChip, selected && styles.selectedChip]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${formatTime(slot)}`}
              >
                <Text style={[styles.timeText, selected && styles.selectedText]}>{formatTime(slot)}</Text>
              </Pressable>
            );
          })}
          {!times.length ? (
            <Text style={styles.unavailableText}>No bookable times are published for this date.</Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, styles.sessionTypeHeading]}>SESSION TYPE</Text>
        <View style={styles.formatRow}>
          {sessionTypes.filter((option) => deliveryMethods.includes(option.key)).map((option) => {
            const selected = selectedType === option.key;
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

        <Text style={[styles.sectionLabel, styles.reasonLabel]}>Reason for Rescheduling</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Scheduling conflict / Personal issue"
          placeholderTextColor="#72847E"
          style={styles.reasonInput}
          accessibilityLabel="Reason for rescheduling"
        />

        <Pressable
          onPress={() => {
            const notes = reason.trim()
              ? `${appointment.notes}${appointment.notes ? '\n' : ''}Reschedule: ${reason.trim()}`
              : appointment.notes;
            updateAppointment(appointment.id, { date, time, type, notes, status: 'pending' });
            router.replace({ pathname: '/done', params: { flow: 'reschedule', appointmentId: appointment.id } });
          }}
          disabled={!time || !selectedType}
          style={({ pressed }) => [
            styles.confirmButton,
            (!time || !selectedType) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>Confirm Reschedule</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCalendarDays(month: Date) {
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - offset + 1)
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: { color: '#397E72', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#657873', fontSize: 13, marginTop: 4, marginBottom: 12 },
  calendarCard: { marginHorizontal: 12, padding: 7, borderWidth: 1, borderColor: '#AFC2BC', borderRadius: 11, backgroundColor: colors.white, shadowColor: '#183C34', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  monthHeader: { height: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  monthArrow: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { color: '#536A64', fontSize: 12, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 2 },
  weekday: { flex: 1, color: '#687C76', fontSize: 11, textAlign: 'center', lineHeight: 17 },
  calendarWeek: { flexDirection: 'row' },
  calendarCell: { flex: 1, aspectRatio: 1.55, minHeight: 21, maxHeight: 25, alignItems: 'center', justifyContent: 'center', margin: 1, borderWidth: 1, borderColor: '#D8E3DF', borderRadius: 7, backgroundColor: colors.white },
  calendarCellSelected: { borderColor: '#55A889', backgroundColor: '#E3F2EB' },
  unavailableCell: { opacity: 0.35 },
  calendarDay: { color: '#586C66', fontSize: 11 },
  outsideMonth: { color: '#A7B4B0' },
  disabledDay: { color: '#CCD5D2' },
  selectedText: { color: '#4E9C8D' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 5 },
  sectionLabel: { color: '#687C76', fontSize: 12, fontWeight: '600' },
  selectedDate: { color: colors.muted, fontSize: 11 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  unavailableText: { color: '#657873', fontSize: 12, paddingVertical: 5 },
  timeChip: { minHeight: 27, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  selectedChip: { borderColor: '#72B7A5', backgroundColor: '#E7F4F0' },
  timeText: { color: '#657873', fontSize: 12 },
  formatRow: { flexDirection: 'row', gap: 5, marginTop: 5 },
  formatChip: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  formatText: { color: '#657873', fontSize: 11 },
  sessionTypeHeading: { marginTop: 11 },
  reasonLabel: { marginTop: 12, marginBottom: 5, color: '#344A45', fontSize: 12 },
  reasonInput: { minHeight: 34, paddingHorizontal: 9, borderWidth: 1, borderColor: '#AFC2BC', borderRadius: 9, backgroundColor: colors.white, color: colors.text, fontSize: 12 },
  confirmButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 22, backgroundColor: '#5BA48F', elevation: 3 },
  disabledButton: { opacity: 0.5 },
  confirmText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  notFound: { color: colors.text, fontSize: 14 },
});