import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getAvailabilityTimes } from '../../lib/availability';
import { getActiveCounselorId } from '../../lib/counselor';
import { formatDate, formatTime } from '../../lib/format';

export default function CounselorReschedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, ready, state, updateAppointment } = useApp();
  const appointment = state.appointments.find((item) => item.id === id);
  const counselorId = getActiveCounselorId(currentUser, state.counselors);
  const availability = state.availabilities?.find((item) => item.counselorId === counselorId);
  const durationMin = appointment?.durationMin ?? 50;
  const availableDates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + index + 1);
      return toDateKey(date);
    }),
    []
  );
  const [date, setDate] = useState(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const times = getAvailabilityTimes(availability, date, durationMin)
    .filter((slot) => date !== appointment?.date || slot !== appointment?.time);
  const time = times.includes(selectedTime) ? selectedTime : times[0] ?? '';

  if (!ready) return null;
  if (currentUser?.role !== 'counselor') return <Redirect href="/(tabs)" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(counselor-tabs)/sessions');
  };

  if (!appointment || appointment.counselorId !== counselorId) {
    return (
      <Screen>
        <Header title="Reschedule Session" onBack={goBack} />
        <Text style={styles.emptyText}>Appointment not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <Header title="Reschedule Session" onBack={goBack} />
        <Text style={styles.subtitle}>Choose a new time for this student appointment.</Text>

        <Text style={styles.sectionTitle}>NEW DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
          {availableDates.map((option) => {
            const selected = date === option;
            return (
              <Pressable
                key={option}
                onPress={() => { setDate(option); setSelectedTime(''); }}
                disabled={!getAvailabilityTimes(availability, option, durationMin).some(
                  (slot) => option !== appointment?.date || slot !== appointment?.time
                )}
                style={[
                  styles.dateOption,
                  selected && styles.selectedOption,
                  !getAvailabilityTimes(availability, option, durationMin).some(
                    (slot) => option !== appointment?.date || slot !== appointment?.time
                  ) && styles.disabledOption,
                ]}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                  disabled: !getAvailabilityTimes(availability, option, durationMin).some(
                    (slot) => option !== appointment?.date || slot !== appointment?.time
                  ),
                }}
                accessibilityLabel={formatDate(option)}
              >
                <Text style={[styles.dateText, selected && styles.selectedText]}>{formatDate(option)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>NEW TIME</Text>
        <View style={styles.timeList}>
          {times.map((option) => {
            const selected = time === option;
            return (
              <Pressable
                key={option}
                onPress={() => setSelectedTime(option)}
                style={[styles.timeOption, selected && styles.selectedOption]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons name="time-outline" size={16} color={selected ? colors.tealDark : colors.muted} />
                <Text style={[styles.timeText, selected && styles.selectedText]}>{formatTime(option)}</Text>
              </Pressable>
            );
          })}
          {!times.length ? (
            <Text style={styles.emptyText}>No bookable times are published for this date.</Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            updateAppointment(appointment.id, { date, time });
            router.replace('/(counselor-tabs)/sessions');
          }}
          disabled={!time}
          style={[styles.confirmButton, !time && styles.disabledOption]}
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>Confirm New Time</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 10 },
  dateList: { gap: 8, paddingBottom: 4 },
  dateOption: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  dateText: { color: colors.text, fontSize: 14 },
  timeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeOption: { minHeight: 42, minWidth: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  timeText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  selectedOption: { borderColor: colors.teal, backgroundColor: '#E7F4F0' },
  disabledOption: { opacity: 0.4 },
  selectedText: { color: colors.tealDark, fontWeight: '700' },
  confirmButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 20, borderRadius: 24, backgroundColor: colors.teal },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  emptyText: { color: colors.text, fontSize: 14 },
});
