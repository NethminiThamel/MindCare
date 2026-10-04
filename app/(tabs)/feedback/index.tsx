import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, BackHeader, Card, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { formatDate } from '../../../lib/format';

export default function FeedbackSessions() {
  const { currentUser, state } = useApp();
  const appointments = state.appointments
    .filter((appointment) => appointment.userId === currentUser?.id && appointment.status === 'completed')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  return (
    <Screen>
      <BackHeader title="Feedback" />
      <Text style={styles.title}>Share your feedback</Text>
      <Text style={styles.subtitle}>Choose a completed session to tell us about your experience.</Text>

      {appointments.length ? (
        <View style={styles.list}>
          {appointments.map((appointment) => {
            const counselor = state.counselors.find((item) => item.id === appointment.counselorId);
            const hasFeedback = state.feedback.some((item) => item.appointmentId === appointment.id);
            if (!counselor) return null;

            return (
              <Card key={appointment.id} style={styles.card}>
                <View style={styles.row}>
                  <Avatar name={counselor.name} color={counselor.avatarColor} size={40} profileType="counselor" />
                  <View style={styles.copy}>
                    <Text style={styles.name}>{counselor.name}</Text>
                    <Text style={styles.date}>{formatDate(appointment.date)}</Text>
                  </View>
                  {hasFeedback ? <Ionicons name="checkmark-circle" size={20} color={colors.teal} /> : null}
                </View>
                <Pressable
                  onPress={() => router.push(
                    hasFeedback ? `/summary/${appointment.id}` : `/(tabs)/feedback/${appointment.id}`
                  )}
                  style={[styles.action, hasFeedback && styles.actionSecondary]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, hasFeedback && styles.actionTextSecondary]}>
                    {hasFeedback ? 'Feedback submitted' : 'Leave feedback'}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="chatbox-ellipses-outline" size={28} color={colors.tealDark} />
          <Text style={styles.emptyTitle}>No completed sessions yet</Text>
          <Text style={styles.emptyText}>Feedback will be available here after you complete a session.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 12 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  list: { gap: 10 },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  date: { color: colors.muted, fontSize: 14 },
  action: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.teal },
  actionSecondary: { backgroundColor: '#EAF4F0' },
  actionText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  actionTextSecondary: { color: colors.tealDark },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 19, textAlign: 'center' },
});
