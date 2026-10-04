import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, BackHeader, Card, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { formatTime } from '../../../lib/format';

const ratings = [
  { value: 5, face: '🌻', label: 'Much Better' },
  { value: 4, face: '🙂', label: 'Better' },
  { value: 3, face: '😐', label: 'Same' },
  { value: 2, face: '😟', label: 'Worse' },
];

export default function Feedback() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { submitFeedback, state } = useApp();
  const appointment = state.appointments.find((item) => item.id === id);
  const counselor = appointment
    ? state.counselors.find((item) => item.id === appointment.counselorId)
    : undefined;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hideName, setHideName] = useState(true);

  if (!appointment || !counselor) {
    return (
      <Screen>
        <BackHeader title="Feedback" />
        <Text style={styles.notFound}>We couldn&apos;t find that session. Go back and choose a completed appointment.</Text>
      </Screen>
    );
  }

  const date = new Date(`${appointment.date}T12:00:00`);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const sessionType = appointment.type === 'video' ? 'Video Session' : appointment.type === 'chat' ? 'Chat Session' : 'In-person Session';

  return (
    <Screen padded={false}>
      <View style={styles.page}>
        <BackHeader title="Feedback" />
        <Card style={styles.sessionCard}>
          <View style={styles.counselorRow}>
            <Avatar name={counselor.name} color={counselor.avatarColor} size={42} profileType="counselor" />
            <View style={styles.counselorInfo}>
              <Text style={styles.counselorName}>{counselor.name}</Text>
              <Text style={styles.counselorSpecialty}>{counselor.specialties[0]}</Text>
            </View>
            <View style={styles.completedBadge}><Text style={styles.completedText}>Completed</Text></View>
          </View>
          <View style={styles.sessionMeta}>
            <Meta icon="calendar-outline" label={`${dateLabel} · ${formatTime(appointment.time)}`} />
            <Text style={styles.sessionType}>{sessionType}</Text>
          </View>
        </Card>

        <Card style={styles.ratingCard}>
          <Text style={styles.prompt}>How do you feel after this session?</Text>
          <View style={styles.ratingRow}>
            {ratings.map((item) => {
              const selected = rating === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRating(item.value)}
                  style={styles.ratingOption}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.ratingCircle, selected && styles.ratingCircleSelected]}>
                    <Text style={styles.ratingFace}>{item.face}</Text>
                  </View>
                  <Text style={[styles.ratingLabel, selected && styles.ratingLabelSelected]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.commentCard}>
          <View style={styles.commentHeading}>
            <Text style={styles.commentTitle}>Any additional thoughts?</Text>
            <Text style={styles.optional}>Optional</Text>
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={`Share what felt helpful, or anything ${counselor.name} could adjust next time (optional)...`}
            placeholderTextColor="#9AA8A4"
            multiline
            maxLength={400}
            textAlignVertical="top"
            style={styles.commentInput}
            accessibilityLabel="Additional feedback"
          />
          <Text style={styles.characterCount}>{comment.length} / 400</Text>
          <View style={styles.privacyRow}>
            <Ionicons name="eye-off-outline" size={17} color={colors.tealDark} />
            <View style={styles.privacyCopy}>
              <Text style={styles.privacyTitle}>Hide your name from feedback</Text>
              <Text style={styles.privacySub}>Your session record is still visible to your counselor.</Text>
            </View>
            <Pressable
              onPress={() => setHideName((value) => !value)}
              style={[styles.toggle, hideName && styles.toggleOn]}
              accessibilityRole="switch"
              accessibilityState={{ checked: hideName }}
              accessibilityLabel="Hide your name from feedback"
            >
              <View style={[styles.toggleKnob, hideName && styles.toggleKnobOn]} />
            </Pressable>
          </View>
        </Card>

        <Pressable
          onPress={() => {
            submitFeedback(appointment.id, rating, comment.trim(), hideName);
            router.replace({ pathname: '/done', params: { flow: 'feedback', appointmentId: appointment.id } });
          }}
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>Submit Feedback</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.tealDark} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18, gap: 12 },
  sessionCard: { padding: 13, borderRadius: 16 },
  counselorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counselorInfo: { flex: 1 },
  counselorName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  counselorSpecialty: { color: colors.muted, fontSize: 13, marginTop: 3 },
  completedBadge: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#8BC9B2', borderRadius: 6, backgroundColor: '#EEF8F3' },
  completedText: { color: colors.tealDark, fontSize: 12, fontWeight: '600' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.muted, fontSize: 13 },
  sessionType: { color: colors.teal, fontSize: 13, fontWeight: '500' },
  ratingCard: { padding: 16, borderRadius: 16 },
  prompt: { color: '#397E72', fontSize: 20, lineHeight: 27, fontWeight: '600', marginBottom: 13 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  ratingOption: { flex: 1, alignItems: 'center', gap: 6 },
  ratingCircle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCE7E2', borderRadius: 24, backgroundColor: colors.white },
  ratingCircleSelected: { borderColor: '#5BAF9E', backgroundColor: '#E8F5F1' },
  ratingFace: { fontSize: 23 },
  ratingLabel: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  ratingLabelSelected: { color: colors.tealDark, fontWeight: '600' },
  commentCard: { padding: 15, borderRadius: 16 },
  commentHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  commentTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optional: { color: colors.muted, fontSize: 13 },
  commentInput: { minHeight: 104, padding: 11, borderWidth: 1, borderColor: '#E7EAE7', borderRadius: 11, color: colors.text, fontSize: 15, lineHeight: 19 },
  characterCount: { color: colors.muted, fontSize: 12, textAlign: 'right', marginTop: 5 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  privacyCopy: { flex: 1, gap: 3 },
  privacyTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  privacySub: { color: colors.muted, fontSize: 12, lineHeight: 14 },
  toggle: { width: 38, height: 23, justifyContent: 'center', padding: 2, borderRadius: 12, backgroundColor: '#CDD7D3' },
  toggleOn: { backgroundColor: '#50B6A5' },
  toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
  submitButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#5BA48F' },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  notFound: { color: colors.muted, fontSize: 14, lineHeight: 21, padding: 16 },
  pressed: { opacity: 0.82 },
});
