import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';

export default function CounselorSessionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, ready, state } = useApp();
  const counselor = state.counselors.find((item) => item.id === id);
  const availability = state.availabilities?.find((item) => item.counselorId === id);
  const canBook = Boolean(
    availability?.isAcceptingSessions
      && availability.days.some((day) => day.enabled)
      && availability.sessionFormats?.some((format) => format.enabled)
      && availability.deliveryMethods?.length
  );

  if (!ready) {
    return (
      <Screen>
        <Text style={styles.notFound}>Loading counselor details...</Text>
      </Screen>
    );
  }

  if (!counselor) {
    return (
      <Screen>
        <Text style={styles.notFound}>Counselor not found.</Text>
      </Screen>
    );
  }

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

        <Text style={styles.title}>Book a Session</Text>
        <Text style={styles.subtitle}>Schedule therapy at your convenience</Text>

        <View style={styles.counselorCard}>
          <Avatar name={counselor.name} color={counselor.avatarColor} size={42} />
          <View style={styles.counselorInfo}>
            <Text style={styles.name} numberOfLines={1}>{counselor.name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{counselor.specialties[0]} Specialist</Text>
          </View>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.bio}>{counselor.bio}</Text>
        </View>

        <Text style={styles.sectionLabel}>COUNSELOR AVAILABILITY</Text>
        {availability?.isAcceptingSessions ? (
          <View style={styles.schedule}>
            {availability.days.filter((day) => day.enabled).map((day) => (
              <Text key={day.day} style={styles.scheduleText}>
                {day.day}: {day.start}-{day.end}
              </Text>
            ))}
            {!availability.days.some((day) => day.enabled) ? (
              <Text style={styles.scheduleEmpty}>No days are currently available.</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.scheduleEmpty}>
            The counselor has not published availability in Firebase yet.
          </Text>
        )}

        <Pressable
          onPress={() => router.push(`/booking/${counselor.id}`)}
          disabled={!canBook}
          style={({ pressed }) => [styles.bookButton, !canBook && styles.disabledButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.bookText}>Book Session</Text>
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
  title: { color: '#397E72', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#657873', fontSize: 13, marginTop: 4, marginBottom: 13 },
  counselorCard: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#AFC2BC', borderRadius: 11, backgroundColor: colors.white },
  counselorInfo: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: '#344A45', fontSize: 14, fontWeight: '600' },
  specialty: { color: '#7B8D88', fontSize: 12 },
  aboutCard: { minHeight: 88, marginTop: 10, marginBottom: 12, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.white },
  aboutTitle: { color: '#344A45', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  bio: { color: '#657873', fontSize: 12, lineHeight: 13 },
  sectionLabel: { color: '#687C76', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  schedule: { gap: 4, marginBottom: 2 },
  scheduleText: { color: '#657873', fontSize: 12 },
  scheduleEmpty: { color: '#657873', fontSize: 12, marginBottom: 2 },
  bookButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 24, backgroundColor: '#5BA48F', elevation: 3 },
  disabledButton: { opacity: 0.5 },
  bookText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  notFound: { color: colors.text, fontSize: 14 },
});