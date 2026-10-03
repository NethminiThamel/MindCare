import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader, Card, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime } from '../../lib/format';

export default function VideoSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, setAppointmentStatus } = useApp();
  const appt = state.appointments.find((a) => a.id === id);
  const counselor = appt ? state.counselors.find((c) => c.id === appt.counselorId) : undefined;

  if (!appt || !counselor) {
    return (
      <Screen>
        <BackHeader title="Session" />
        <Text>Not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title="Video session" />
      <View style={styles.stage}>
        <Text style={styles.live}>MindCare Virtual Room</Text>
        <Text style={styles.name}>{counselor.name}</Text>
        <Text style={styles.muted}>
          {formatDate(appt.date)} · {formatTime(appt.time)}
        </Text>
      </View>
      <Card>
        <Text style={styles.h}>Recommended warm-up</Text>
        <Text style={styles.muted}>Find a quiet private space. Take three deep breaths before you join.</Text>
      </Card>
      <PrimaryButton
        label="End session & mark complete"
        onPress={() => {
          setAppointmentStatus(appt.id, 'completed');
          router.replace(`/summary/${appt.id}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: colors.tealDark,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 220,
    justifyContent: 'center',
  },
  live: { color: colors.tealSoft, fontWeight: '700' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  muted: { color: colors.muted, lineHeight: 20 },
  h: { fontWeight: '800', color: colors.text, marginBottom: 6 },
});
