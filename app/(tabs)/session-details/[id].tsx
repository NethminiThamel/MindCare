import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { formatTime } from '../../../lib/format';

export default function SessionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, state } = useApp();
  const appointment = state.appointments.find((item) => item.id === id);
  const counselor = appointment
    ? state.counselors.find((item) => item.id === appointment.counselorId)
    : undefined;

  if (!appointment || !counselor) {
    return (
      <Screen>
        <Text style={styles.notFound}>Session not found.</Text>
      </Screen>
    );
  }

  const appointmentDate = new Date(`${appointment.date}T12:00:00`);
  const dateLabel = appointmentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const typeLabel = appointment.type === 'video'
    ? 'VIDEO CALL'
    : appointment.type === 'chat'
      ? 'CHAT SESSION'
      : 'IN-PERSON';

  const joinSession = () => {
    if (appointment.type === 'video') {
      router.push(`/session/${appointment.id}`);
    } else if (appointment.type === 'chat') {
      router.push(`/chat/${counselor.id}`);
    } else {
      Alert.alert('In-person session', 'Meet your counselor at the campus wellness center.');
    }
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

        <View style={styles.appointmentCard}>
          <View style={styles.counselorRow}>
            <Avatar name={counselor.name} color={counselor.avatarColor} size={38} />
            <View style={styles.counselorInfo}>
              <Text style={styles.counselorName}>{counselor.name}</Text>
              <Text style={styles.counselorTitle}>{counselor.title}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleCopy}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              <Text style={styles.timeText}>{formatTimeRange(appointment.time, appointment.durationMin)}</Text>
            </View>
            <View style={styles.typeBadge}><Text style={styles.typeText}>{typeLabel}</Text></View>
          </View>
        </View>

        {appointment.type === 'video' ? (
          <View style={styles.roomCard}>
            <View style={styles.roomIcon}>
              <Ionicons name="videocam-outline" size={16} color={colors.tealDark} />
            </View>
            <View style={styles.roomCopy}>
              <Text style={styles.roomTitle}>MindCare Virtual Room</Text>
              <Text style={styles.roomSubtitle}>Your secure session link opens when you join.</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Recommended Warm-up</Text>
        <WarmupCard
          icon="lock-closed-outline"
          title="Find a quiet private space"
          body="Ensure you are in a comfortable environment where you can speak freely."
        />
        <WarmupCard
          icon="fitness-outline"
          title="Take 3 deep breaths"
          body="Take a brief moment to transition from your daily activities into the healing space."
        />

        {appointment.status === 'upcoming' ? (
          <Pressable onPress={joinSession} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>
              {appointment.type === 'video' ? 'Join Session' : appointment.type === 'chat' ? 'Open Chat' : 'Get Directions'}
            </Text>
          </Pressable>
        ) : null}

        {appointment.status !== 'upcoming' ? (
          <View style={styles.statusNotice}>
            <Text style={styles.statusText}>{appointment.status === 'pending' ? 'Waiting for counselor confirmation' : `This session is ${appointment.status}.`}</Text>
          </View>
        ) : null}

        {appointment.status === 'upcoming' || appointment.status === 'pending' ? (
          <View style={styles.secondaryActions}>
            <Pressable onPress={() => router.push(`/reschedule-session/${appointment.id}`)} style={styles.secondaryButton} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/cancel-session/${appointment.id}`)} style={styles.cancelButton} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function WarmupCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.warmupCard}>
      <View style={styles.warmupIcon}><Ionicons name={icon} size={13} color={colors.tealDark} /></View>
      <View style={styles.warmupCopy}>
        <Text style={styles.warmupTitle}>{title}</Text>
        <Text style={styles.warmupBody}>{body}</Text>
      </View>
    </View>
  );
}

function formatTimeRange(time: string, duration: number) {
  const [hour, minute] = time.split(':').map(Number);
  const end = new Date();
  end.setHours(hour, minute + duration, 0, 0);
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  return `${formatTime(time)} - ${formatTime(endTime)} (${duration}m)`;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 11, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  appointmentCard: { padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.white },
  counselorRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8 },
  counselorInfo: { flex: 1, minWidth: 0, gap: 3 },
  counselorName: { color: '#344A45', fontSize: 12, fontWeight: '600' },
  counselorTitle: { color: '#788B85', fontSize: 11 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  scheduleRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  scheduleCopy: { flex: 1, gap: 3 },
  dateText: { color: '#344A45', fontSize: 12, fontWeight: '600' },
  timeText: { color: '#71847E', fontSize: 11 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7, backgroundColor: '#E5F3EE' },
  typeText: { color: '#4D917C', fontSize: 11, fontWeight: '600' },
  roomCard: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: '#E4F2EE' },
  roomIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.white },
  roomCopy: { flex: 1, gap: 2 },
  roomTitle: { color: '#344A45', fontSize: 12, fontWeight: '600' },
  roomSubtitle: { color: '#6F827C', fontSize: 11 },
  sectionTitle: { color: '#397E72', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  warmupCard: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.white },
  warmupIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#E8F3EF' },
  warmupCopy: { flex: 1, gap: 2 },
  warmupTitle: { color: '#394F48', fontSize: 11, fontWeight: '600' },
  warmupBody: { color: '#7A8C86', fontSize: 11, lineHeight: 14 },
  primaryButton: { minHeight: 37, alignItems: 'center', justifyContent: 'center', marginTop: 6, borderRadius: 21, backgroundColor: '#5BA48F' },
  primaryButtonText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  secondaryActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  secondaryButton: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 17, backgroundColor: colors.white },
  secondaryButtonText: { color: '#566C64', fontSize: 11, fontWeight: '600' },
  cancelButton: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4AAA0', borderRadius: 17, backgroundColor: colors.white },
  cancelButtonText: { color: '#B75D55', fontSize: 11, fontWeight: '600' },
  statusNotice: { marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: '#EEF5F2' },
  statusText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  notFound: { color: colors.text, fontSize: 14 },
});