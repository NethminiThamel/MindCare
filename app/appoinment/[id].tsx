import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, BackHeader, Card, GhostButton, Pill, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime } from '../../lib/format';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, setAppointmentStatus } = useApp();
  const appt = state.appointments.find((a) => a.id === id);
  const counselor = appt ? state.counselors.find((c) => c.id === appt.counselorId) : undefined;
  const feedback = state.feedback.find((f) => f.appointmentId === id);

  if (!appt || !counselor) {
    return (
      <Screen>
        <BackHeader title="Appointment" />
        <Text>Appointment not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title={appt.status === 'upcoming' ? 'Upcoming' : 'Session'} />
      <View style={{ alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Avatar name={counselor.name} color={counselor.avatarColor} size={64} profileType="counselor" />
        <Text style={styles.name}>{counselor.name}</Text>
        <Text style={styles.muted}>{counselor.title}</Text>
        <Pill text={appt.status} tone={appt.status === 'cancelled' ? 'coral' : 'teal'} />
      </View>
      <Card>
        <Text style={styles.row}>
          {formatDate(appt.date)} · {formatTime(appt.time)} · {appt.durationMin} min
        </Text>
        <Text style={styles.muted}>
          {appt.type === 'video' ? 'Video call' : appt.type === 'chat' ? 'Chat session' : 'In person'}
        </Text>
        {appt.notes ? <Text style={[styles.row, { marginTop: 8 }]}>{appt.notes}</Text> : null}
      </Card>

      {appt.status === 'upcoming' ? (
        <View style={{ gap: 10, marginTop: 16 }}>
          {appt.type === 'video' ? (
            <PrimaryButton label="Join session" onPress={() => router.push(`/session/${appt.id}`)} />
          ) : null}
          <PrimaryButton
            label="Reschedule"
            color={colors.tealMid}
            onPress={() => router.push(`/(tabs)/reschedule-session/${appt.id}`)}
          />
          <GhostButton label="Cancel appointment" onPress={() => router.push(`/(tabs)/cancel-session/${appt.id}`)} />
          <GhostButton
            label={appt.type === 'chat' ? 'Open chat' : 'Message counselor'}
            onPress={() => router.push(`/chat/${counselor.id}`)}
          />
        </View>
      ) : null}

      {appt.status === 'completed' ? (
        <View style={{ gap: 10, marginTop: 16 }}>
          <PrimaryButton label="Session summary" onPress={() => router.push(`/summary/${appt.id}`)} />
          {feedback ? (
            <Card>
              <Text style={styles.row}>Your rating: {feedback.rating}/5</Text>
              <Text style={styles.muted}>{feedback.comment}</Text>
            </Card>
          ) : (
            <PrimaryButton
              label="Leave feedback"
              color={colors.tealMid}
              onPress={() => router.push(`/feedback/${appt.id}`)}
            />
          )}
        </View>
      ) : null}

      {appt.status === 'cancelled' ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.muted}>This session was cancelled. You can still book a new time.</Text>
          <PrimaryButton label="Book again" onPress={() => router.push(`/book/${counselor.id}`)} />
        </Card>
      ) : null}

      {appt.status === 'upcoming' ? (
        <GhostButton
          label="Mark completed"
          onPress={() => {
            setAppointmentStatus(appt.id, 'completed');
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, lineHeight: 20 },
  row: { fontWeight: '700', color: colors.text },
});
