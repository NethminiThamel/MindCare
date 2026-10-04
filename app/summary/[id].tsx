import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { BackHeader, Card, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime } from '../../lib/format';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const appt = state.appointments.find((a) => a.id === id);
  const counselor = appt ? state.counselors.find((c) => c.id === appt.counselorId) : undefined;
  const feedback = state.feedback.find((f) => f.appointmentId === id);

  if (!appt || !counselor) {
    return (
      <Screen>
        <BackHeader title="Summary" />
        <Text>Not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title="Session summary" />
      <Text style={styles.title}>{counselor.name}</Text>
      <Text style={styles.muted}>
        {formatDate(appt.date)} · {formatTime(appt.time)}
      </Text>
      <Card style={{ marginTop: 16 }}>
        <Text style={styles.h}>Focus</Text>
        <Text style={styles.muted}>{appt.notes || 'No notes were attached to this booking.'}</Text>
      </Card>
      <Card style={{ marginTop: 10 }}>
        <Text style={styles.h}>Next step</Text>
        <Text style={styles.muted}>Keep daily check-ins through the week so your next session has a clearer picture.</Text>
      </Card>
      {feedback ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={styles.h}>Your feedback</Text>
          <Text style={styles.muted}>
            {feedback.rating}/5 — {feedback.comment}
          </Text>
        </Card>
      ) : (
        <PrimaryButton label="Leave feedback" onPress={() => router.push(`/feedback/${appt.id}`)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, lineHeight: 20 },
  h: { fontWeight: '800', color: colors.text, marginBottom: 6 },
});
