import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader, Field, GhostButton, PrimaryButton, Screen } from '../../components/ui';
import { colors, moodOptions, type MoodKey } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function MoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateMood, deleteMood } = useApp();
  const entry = state.moods.find((m) => m.id === id);
  const [mood, setMood] = useState<MoodKey>(entry?.mood ?? 'okay');
  const [stress, setStress] = useState(entry?.stressLevel ?? 5);
  const [note, setNote] = useState(entry?.note ?? '');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  if (!entry) {
    return (
      <Screen>
        <BackHeader title="Check-in" />
        <Text>Entry not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title="Edit check-in" />
      <View style={styles.emojiRow}>
        {moodOptions.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMood(m.key)}
            style={[styles.emoji, mood === m.key && styles.emojiOn]}
          >
            <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
            <Text style={styles.emojiLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Stress level {stress}/10</Text>
      <View style={styles.stressRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable key={n} onPress={() => setStress(n)} style={[styles.stress, stress === n && styles.stressOn]}>
            <Text style={{ color: stress === n ? '#fff' : colors.text, fontWeight: '700', fontSize: 14 }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Note" value={note} onChangeText={setNote} placeholder="What is taking up space?" multiline />
      <PrimaryButton
        label="Save changes"
        onPress={() => {
          updateMood(entry.id, { mood, stressLevel: stress, note: note.trim() });
          router.replace({
            pathname: '/done',
            params: {
              title: 'Check-in updated',
              body: 'Your mood log on this device is up to date.',
              href: '/(tabs)/moods',
            },
          });
        }}
      />
      <GhostButton label="Delete check-in" onPress={() => setConfirmDeleteVisible(true)} />
      <Modal transparent visible={confirmDeleteVisible} animationType="fade" onRequestClose={() => setConfirmDeleteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Delete this check-in?</Text>
            <Text style={styles.confirmBody}>This mood entry will be removed from your history.</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirmDeleteVisible(false)} style={styles.keepButton} accessibilityRole="button">
                <Text style={styles.keepText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  deleteMood(entry.id);
                  setConfirmDeleteVisible(false);
                  router.replace('/(tabs)/checkin');
                }}
                style={styles.confirmDeleteButton}
                accessibilityRole="button"
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emoji: {
    width: '30%',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emojiOn: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  emojiLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 },
  label: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  stressRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  stress: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  stressOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(17, 39, 34, 0.35)' },
  confirmDialog: { padding: 16, borderRadius: 12, backgroundColor: colors.white },
  confirmTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  confirmBody: { color: colors.muted, fontSize: 12, lineHeight: 15, marginTop: 6 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  keepButton: { minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  keepText: { color: colors.tealDark, fontSize: 12, fontWeight: '600' },
  confirmDeleteButton: { minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.coral },
  confirmDeleteText: { color: colors.white, fontSize: 12, fontWeight: '600' },
});
