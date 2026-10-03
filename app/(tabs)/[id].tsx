import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { isStudentAnonymous, studentDisplayName } from '../../lib/student-privacy';

export default function CounselorStudentInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, state } = useApp();

  const student = state.users.find((u) => u.id === id);
  const studentMoods = state.moods.filter((m) => m.userId === id);

  const isAnonymous = isStudentAnonymous(student);
  const displayName = studentDisplayName(student);

  return (
    <Screen>
      <Header title="Student Session Info" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Student Profile Card */}
        <Card style={styles.card}>
          <View style={styles.topRow}>
            <View style={[styles.avatar, { backgroundColor: student?.avatarColor ?? colors.teal }]}>
              <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              {student && !isAnonymous && (
                <>
                  <Text style={styles.meta}>{student.year} · {student.major}</Text>
                  <Text style={styles.email}>{student.email}</Text>
                </>
              )}
            </View>
          </View>
          {!isAnonymous && student?.bio && <Text style={styles.bio}>{student.bio}</Text>}
        </Card>

        {/* Latest Shared Mood Logs */}
        <Text style={styles.sectionTitle}>Shared Mood Check-Ins</Text>
        {studentMoods.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent mood check-ins logged by this student.</Text>
          </Card>
        ) : (
          studentMoods.map((m) => (
            <Card key={m.id} style={styles.moodCard}>
              <View style={styles.moodTop}>
                <Text style={styles.moodTag}>{m.mood.toUpperCase()}</Text>
                <Text style={styles.stressTag}>Stress Level: {m.stressLevel}/10</Text>
              </View>
              {m.note ? <Text style={styles.moodNote}>{m.note}</Text> : null}
              <Text style={styles.dateText}>{new Date(m.createdAt).toLocaleDateString()}</Text>
            </Card>
          ))
        )}

        {/* Crisis Safety Plan */}
        <Text style={styles.sectionTitle}>Crisis Safety Plan</Text>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Crisis safety plans stay private to the student and are not shared with counselors.
          </Text>
        </Card>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Trusted contacts stay private to the student.
          </Text>
        </Card>

        {/* Quick Chat Shortcut */}
        <Pressable
          style={styles.chatBtn}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: currentUser?.id ?? '', userId: id } })}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#FFF" />
          <Text style={styles.chatBtnText}>Open Chat with {displayName}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 15, color: colors.muted, marginTop: 2 },
  email: { fontSize: 14, color: colors.tealDark, marginTop: 1 },
  bio: { fontSize: 15, color: colors.text, fontStyle: 'italic', marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 8, marginBottom: 10 },
  emptyCard: { padding: 16, alignItems: 'center', marginBottom: 16 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  moodCard: { marginBottom: 10, padding: 14 },
  moodTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  moodTag: { fontSize: 14, fontWeight: '800', color: colors.tealDark },
  stressTag: { fontSize: 14, fontWeight: '700', color: colors.coral },
  moodNote: { fontSize: 15, color: colors.text, fontStyle: 'italic', marginBottom: 6 },
  dateText: { fontSize: 13, color: colors.muted },
  label: { fontSize: 14, fontWeight: '800', color: colors.tealDark, marginTop: 6 },
  value: { fontSize: 15, color: colors.text, marginTop: 2, marginBottom: 6 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 12 },
  contactName: { fontSize: 14, fontWeight: '800', color: colors.text },
  contactPhone: { fontSize: 14, color: colors.muted, marginTop: 2 },
  chatBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.tealDark, paddingVertical: 14, borderRadius: 10, marginVertical: 20 },
  chatBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
