import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { studentDisplayName } from '../../lib/student-privacy';

export default function CounselorCalendar() {
  const { currentUser, state } = useApp();
  const counselorId = currentUser?.id ?? '';
  const appointments = state.appointments
    .filter((appointment) => appointment.counselorId === counselorId && ['upcoming', 'pending'].includes(appointment.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const [selectedDate, setSelectedDate] = useState(() => appointments[0]?.date ?? localDateKey(new Date()));
  const [walkInsEnabled, setWalkInsEnabled] = useState(true);
  const selectedDay = new Date(`${selectedDate}T12:00:00`);
  const weekStart = new Date(selectedDay);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const dayAppointments = appointments.filter((appointment) => appointment.date === selectedDate);
  const morningAppointments = dayAppointments.filter((appointment) => Number(appointment.time.slice(0, 2)) < 12);
  const afternoonAppointments = dayAppointments.filter((appointment) => Number(appointment.time.slice(0, 2)) >= 12);

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.monthHeader}>
            <View>
              <Text style={styles.eyebrow}>SELECT DATE</Text>
              <Text style={styles.monthTitle}>{selectedDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => router.push('/counselor-availability')} style={styles.settingsButton} accessibilityRole="button" accessibilityLabel="Availability settings">
              <Ionicons name="options-outline" size={15} color={colors.tealDark} />
            </Pressable>
          </View>

          <View style={styles.dateStrip}>
            {week.map((date) => {
              const key = localDateKey(date);
              const selected = selectedDate === key;
              return (
                <Pressable key={key} onPress={() => setSelectedDate(key)} style={[styles.dateCell, selected && styles.dateCellSelected]} accessibilityRole="button" accessibilityState={{ selected }}>
                  <Text style={[styles.dateName, selected && styles.selectedText]}>{date.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <Text style={[styles.dateNumber, selected && styles.selectedText]}>{date.getDate()}</Text>
                  {appointments.some((appointment) => appointment.date === key) ? <View style={[styles.dateDot, selected && styles.dateDotSelected]} /> : <View style={styles.dateDotPlaceholder} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.walkInCard}>
            <View style={styles.walkInIcon}><Ionicons name="time-outline" size={15} color={colors.tealDark} /></View>
            <View style={styles.walkInCopy}>
              <Text style={styles.walkInTitle}>Emergency Walk-ins</Text>
              <Text style={styles.walkInSubtitle}>Allow campus crisis triage referrals today</Text>
            </View>
            <Switch value={walkInsEnabled} onValueChange={setWalkInsEnabled} trackColor={{ false: colors.line, true: '#6ABBA4' }} />
          </View>

          <Pressable onPress={() => router.push('/counselor-availability')} style={styles.addSlotButton} accessibilityRole="button">
            <Ionicons name="add" size={15} color={colors.white} />
            <Text style={styles.addSlotText}>Add Time Slot</Text>
          </Pressable>

          <ScheduleBlock title="Morning Block" time="09:00 AM - 12:30 PM" appointments={morningAppointments} state={state} />
          <ScheduleBlock title="Afternoon Block" time="02:00 PM - 05:30 PM" appointments={afternoonAppointments} state={state} />
        </ScrollView>
      </View>
    </Screen>
  );
}

function ScheduleBlock({ title, time, appointments, state }: {
  title: string;
  time: string;
  appointments: typeof state.appointments;
  state: ReturnType<typeof useApp>['state'];
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeading}>
        <View style={styles.blockTitleRow}><Ionicons name="time-outline" size={12} color={colors.tealDark} /><Text style={styles.blockTitle}>{title}</Text></View>
        <Text style={styles.blockTime}>{time}</Text>
      </View>
      {appointments.length ? appointments.map((appointment) => {
        const student = state.users.find((user) => user.id === appointment.userId);
        const name = studentDisplayName(student, appointment.isAnonymous);
        const anonymous = Boolean(student?.isAnonymous || appointment.isAnonymous);
        return (
          <Pressable key={appointment.id} onPress={() => router.push(`/counselor-appointment/${appointment.id}`)} style={styles.slotRow} accessibilityRole="button">
            <View style={styles.slotTime}>
              <Text style={styles.slotTimeText}>{formatScheduleTime(appointment.time)}</Text>
              <Text style={styles.slotDuration}>{appointment.durationMin} min session</Text>
            </View>
            <View style={styles.slotStudent}>
              <Text style={styles.slotStudentName}>{anonymous ? `${name} (Confidential)` : name}</Text>
              <Text style={styles.slotNotes} numberOfLines={1}>{appointment.notes}</Text>
            </View>
            <Text style={styles.bookedTag}>{appointment.status === 'pending' ? 'Pending' : 'Booked'}</Text>
            <Ionicons name="ellipsis-vertical" size={13} color={colors.muted} />
          </Pressable>
        );
      }) : (
        <Pressable onPress={() => router.push('/counselor-availability')} style={styles.openSlot} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={13} color={colors.tealDark} />
          <Text style={styles.openSlotText}>Open Slot</Text>
          <Text style={styles.openSlotHint}>Tap to add availability</Text>
        </Pressable>
      )}
    </View>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatScheduleTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingBottom: 20 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  eyebrow: { color: '#53645F', fontSize: 13, fontWeight: '600', marginBottom: 3 },
  monthTitle: { color: '#397E72', fontSize: 16, fontWeight: '700' },
  settingsButton: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.white },
  dateStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  dateCell: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 8 },
  dateCellSelected: { backgroundColor: '#5BA48F' },
  dateName: { color: '#53645F', fontSize: 12, fontWeight: '600' },
  dateNumber: { color: colors.text, fontSize: 14, fontWeight: '600' },
  selectedText: { color: colors.white },
  dateDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#57A992' },
  dateDotSelected: { backgroundColor: colors.white },
  dateDotPlaceholder: { width: 3, height: 3 },
  walkInCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.white },
  walkInIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#EAF4EF' },
  walkInCopy: { flex: 1, gap: 2 },
  walkInTitle: { color: '#397E72', fontSize: 15, fontWeight: '600' },
  walkInSubtitle: { color: '#53645F', fontSize: 13, fontWeight: '500' },
  addSlotButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, borderRadius: 9, backgroundColor: '#5BA48F' },
  addSlotText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  block: { marginBottom: 14 },
  blockHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  blockTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockTitle: { color: '#397E72', fontSize: 14, fontWeight: '700' },
  blockTime: { color: '#53645F', fontSize: 13, fontWeight: '500' },
  slotRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.white },
  slotTime: { width: 55, gap: 2 },
  slotTimeText: { color: '#397E72', fontSize: 14, fontWeight: '700' },
  slotDuration: { color: '#53645F', fontSize: 12, fontWeight: '500' },
  slotStudent: { flex: 1, minWidth: 0, gap: 2 },
  slotStudentName: { color: '#40554F', fontSize: 14, fontWeight: '600' },
  slotNotes: { color: '#53645F', fontSize: 12, fontWeight: '500' },
  bookedTag: { color: '#28695E', fontSize: 12, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: '#C8E5D9', borderRadius: 7, backgroundColor: '#EFF7F3' },
  openSlot: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  openSlotText: { color: colors.tealDark, fontSize: 14, fontWeight: '600' },
  openSlotHint: { marginLeft: 'auto', color: '#53645F', fontSize: 12, fontWeight: '500' },
});
