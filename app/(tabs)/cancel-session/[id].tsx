import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { formatDate, formatTime } from '../../../lib/format';

const reasons = [
  'I have a scheduling conflict',
  'My mental health situation changed',
  'I want to try a different counselor',
  'Other / Personal reasons',
];

export default function CancelSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, state, updateAppointment, setAppointmentStatus } = useApp();
  const appointment = state.appointments.find((item) => item.id === id);
  const counselor = appointment
    ? state.counselors.find((item) => item.id === appointment.counselorId)
    : undefined;
  const [reason, setReason] = useState(reasons[3]);

  if (!appointment || !counselor) {
    return <Screen><Text style={styles.notFound}>Appointment not found.</Text></Screen>;
  }

  const confirmCancellation = () => {
    const notes = `${appointment.notes}${appointment.notes ? '\n' : ''}Cancel: ${reason}`;
    updateAppointment(appointment.id, { notes });
    setAppointmentStatus(appointment.id, 'cancelled');
    router.replace({ pathname: '/done', params: { flow: 'cancel', appointmentId: appointment.id } });
  };

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

        <View style={styles.warning}>
          <View style={styles.warningIcon}><Ionicons name="alert-circle-outline" size={15} color="#BD6E5D" /></View>
          <Text style={styles.warningText}>Sessions cancelled within 24 hours of starting may still count against your active university partner plan credits.</Text>
        </View>

        <View style={styles.appointmentCard}>
          <Avatar name={counselor.name} color={counselor.avatarColor} size={34} />
          <View style={styles.appointmentCopy}>
            <Text style={styles.appointmentLabel}>APPOINTMENT TO CANCEL</Text>
            <Text style={styles.appointmentText} numberOfLines={2}>
              {counselor.name} · {formatDate(appointment.date)}, {formatTime(appointment.time)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Why are you cancelling?</Text>
        <View style={styles.reasonList}>
          {reasons.map((option) => {
            const selected = reason === option;
            return (
              <Pressable
                key={option}
                onPress={() => setReason(option)}
                style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.reasonText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={confirmCancellation} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.confirmText}>Confirm Cancellation</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.keepButton} accessibilityRole="button">
          <Text style={styles.keepText}>Keep Appointment</Text>
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
  warning: { minHeight: 50, flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginHorizontal: 5, marginBottom: 10, paddingHorizontal: 9, paddingVertical: 8, borderWidth: 1, borderColor: '#E7B6A8', borderRadius: 10, backgroundColor: '#FFF2ED' },
  warningIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#FBE2D9' },
  warningText: { flex: 1, color: '#B56656', fontSize: 11, lineHeight: 11 },
  appointmentCard: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.white },
  appointmentCopy: { flex: 1, minWidth: 0, gap: 3 },
  appointmentLabel: { color: '#7B8D87', fontSize: 11, fontWeight: '600' },
  appointmentText: { color: '#344A45', fontSize: 11, fontWeight: '600' },
  title: { color: '#344A45', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  reasonList: { gap: 5 },
  reasonOption: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  reasonOptionSelected: { borderColor: '#72B7A5', backgroundColor: '#E7F4F0' },
  radio: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C8D5D0', borderRadius: 7 },
  radioSelected: { borderColor: '#5BA48F', backgroundColor: '#5BA48F' },
  radioDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.white },
  reasonText: { color: '#50645D', fontSize: 11 },
  confirmButton: { minHeight: 39, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 22, backgroundColor: '#E9836E' },
  confirmText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  keepButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center', marginTop: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.white },
  keepText: { color: '#526860', fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  notFound: { color: colors.text, fontSize: 14 },
});