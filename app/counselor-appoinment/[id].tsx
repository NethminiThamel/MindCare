import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { isStudentAnonymous, studentDisplayName } from '../../lib/student-privacy';

export default function CounselorAppointmentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, state, setAppointmentStatus } = useApp();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(counselor-tabs)/sessions');
  };

  const appt = state.appointments.find((a) => a.id === id);
  const student = appt ? state.users.find((u) => u.id === appt.userId) : null;

  if (!appt) {
    return (
      <Screen>
        <Header title="Appointment Details" onBack={goBack} />
        <Text style={styles.errorText}>Appointment not found.</Text>
      </Screen>
    );
  }

  const isAnonymous = isStudentAnonymous(student, appt.isAnonymous);
  const displayName = studentDisplayName(student, appt.isAnonymous);

  const markComplete = () => {
    setAppointmentStatus(appt.id, 'completed');
    Alert.alert('Session Completed', `Appointment with ${displayName} has been marked as completed.`);
  };

  const cancelSession = () => {
    setAppointmentStatus(appt.id, 'cancelled');
    Alert.alert('Session Cancelled', 'Appointment has been cancelled.');
    goBack();
  };

  return (
    <Screen>
      <Header title="Appointment Details" onBack={goBack} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Tag */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              appt.status === 'upcoming'
                ? styles.statusUpcoming
                : appt.status === 'completed'
                ? styles.statusCompleted
                : styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                appt.status === 'upcoming'
                  ? styles.textUpcoming
                  : appt.status === 'completed'
                  ? styles.textCompleted
                  : styles.textCancelled,
              ]}
            >
              Status: {appt.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.typeBadge}>
            <Ionicons
              name={appt.type === 'video' ? 'videocam-outline' : appt.type === 'chat' ? 'chatbubble-ellipses-outline' : 'people-outline'}
              size={16}
              color={colors.tealDark}
            />
            <Text style={styles.typeText}>
              {appt.type === 'in-person' ? 'In-Person Session' : `${appt.type === 'video' ? 'Video' : 'Chat'} Session`}
            </Text>
          </View>
        </View>

        {/* Student Info Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Student Information</Text>
          <Text style={styles.studentName}>{displayName}</Text>
          {student && !isAnonymous && (
            <>
              <Text style={styles.studentMeta}>Academic Year: {student.year}</Text>
              <Text style={styles.studentMeta}>Major: {student.major}</Text>
              <Text style={styles.studentMeta}>Email: {student.email}</Text>
              <Text style={styles.studentMeta}>Phone: {student.phone ?? 'N/A'}</Text>
            </>
          )}

          <Pressable
            style={styles.viewProfileBtn}
            onPress={() => router.push(`/counselor-student/${appt.userId}`)}
          >
            <Ionicons name="person-outline" size={16} color={colors.tealDark} />
            <Text style={styles.viewProfileText}>View Full Student Session Info & Moods</Text>
          </Pressable>
        </Card>

        {/* Time & Location */}
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Date, Time & Format</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.tealDark} />
            <Text style={styles.infoText}>{appt.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.tealDark} />
            <Text style={styles.infoText}>{appt.time} ({appt.durationMin} minutes)</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.tealDark} />
            <Text style={styles.infoText}>
              {appt.type === 'video'
                ? 'Secure Video Room (In-App)'
                : appt.type === 'chat'
                  ? 'Secure In-App Chat'
                  : 'Campus Wellness Center, Room 204'}
            </Text>
          </View>
        </Card>

        {/* Student Request Notes */}
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Student Initial Notes</Text>
          <Text style={styles.notesText}>{appt.notes || 'No initial notes provided.'}</Text>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginVertical: 20 }}>
          {appt.type === 'video' && appt.status === 'upcoming' && (
            <PrimaryButton
              label="📹 Join Live Video Session"
              onPress={() => Alert.alert('Launching Video', 'Connecting to secure telehealth video room...')}
            />
          )}

          <Pressable
            style={styles.chatBtn}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: currentUser?.id ?? '', userId: appt.userId } })}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={colors.tealDark} />
            <Text style={styles.chatBtnText}>Open Direct Chat with Student</Text>
          </Pressable>

          {appt.status === 'upcoming' && (
            <>
              <Pressable style={styles.completeBtn} onPress={markComplete}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.completeBtnText}>Mark Session as Completed</Text>
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={cancelSession}>
                <Text style={styles.cancelBtnText}>Cancel Session</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: { color: colors.coral, marginTop: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusUpcoming: { backgroundColor: '#E8F5F3' },
  statusCompleted: { backgroundColor: '#E3F8EC' },
  statusCancelled: { backgroundColor: '#FFE8E8' },
  statusText: { fontSize: 13, fontWeight: '800' },
  textUpcoming: { color: colors.tealDark },
  textCompleted: { color: '#1B8A4C' },
  textCancelled: { color: colors.coral },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  card: { marginBottom: 14, padding: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: colors.tealDark, textTransform: 'uppercase', marginBottom: 8 },
  studentName: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  studentMeta: { fontSize: 15, color: colors.muted, marginTop: 2 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#E8F5F3', padding: 10, borderRadius: 8 },
  viewProfileText: { fontSize: 14, fontWeight: '700', color: colors.tealDark },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  infoText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  notesText: { fontSize: 14, color: colors.text, fontStyle: 'italic', lineHeight: 20 },
  chatBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#E8F5F3', paddingVertical: 12, borderRadius: 10 },
  chatBtnText: { color: colors.tealDark, fontWeight: '700', fontSize: 14 },
  completeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.tealDark, paddingVertical: 12, borderRadius: 10 },
  completeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: colors.coral, fontWeight: '700', fontSize: 15 },
});
