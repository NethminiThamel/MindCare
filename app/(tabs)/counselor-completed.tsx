import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { Appointment, SessionFeedback, User } from '../types';
import { studentDisplayName } from '../lib/student-privacy';

export default function CounselorCompleted() {
  const { currentUser, state } = useApp();
  const counselorId = currentUser?.id ?? '';

  const completed = state.appointments.filter(
    (a: Appointment) => a.counselorId === counselorId && a.status === 'completed'
  );

  return (
    <Screen>
      <Header title="Completed Sessions" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sub}>Log of past completed student counseling sessions.</Text>

        {completed.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="archive-outline" size={32} color={colors.teal} />
            <Text style={styles.emptyTitle}>No Completed Sessions Recorded</Text>
            <Text style={styles.emptySub}>Past finished sessions will be logged here.</Text>
          </Card>
        ) : (
          completed.map((item: Appointment) => {
            const student = state.users.find((u: User) => u.id === item.userId);
            const feedback = state.feedback.find((f: SessionFeedback) => f.appointmentId === item.id);
            const name = studentDisplayName(student, item.isAnonymous);

            return (
              <Card key={item.id} style={styles.card}>
                <View style={styles.topRow}>
                  <Text style={styles.date}>{item.date} at {item.time}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.type}</Text>
                  </View>
                </View>

                <Text style={styles.name}>{name}</Text>
                <Text style={styles.notes}>Session Notes: {item.notes}</Text>

                {feedback ? (
                  <View style={styles.feedbackBox}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>{feedback.rating}.0 / 5.0 Student Rating</Text>
                    </View>
                    {feedback.hideNameFromCounselor ? (
                      <View style={styles.anonymousLabel}>
                        <Ionicons name="eye-off-outline" size={12} color={colors.tealDark} />
                        <Text style={styles.anonymousText}>Name hidden from feedback</Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentText}>{feedback.comment}</Text>
                  </View>
                ) : (
                  <Text style={styles.noFeedback}>No student review submitted yet.</Text>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.muted, fontSize: 15, marginTop: 4, marginBottom: 16 },
  emptyCard: { padding: 24, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' },
  card: { marginBottom: 14, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  typeBadge: { backgroundColor: '#E8F5F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 13, fontWeight: '700', color: colors.tealDark, textTransform: 'capitalize' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  notes: { fontSize: 15, color: colors.text, fontStyle: 'italic', marginVertical: 8 },
  feedbackBox: { backgroundColor: '#F8FAF9', padding: 10, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: colors.border },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.text },
  commentText: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  anonymousLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  anonymousText: { fontSize: 13, color: colors.tealDark },
  noFeedback: { fontSize: 13, color: colors.muted, marginTop: 4 },
});
