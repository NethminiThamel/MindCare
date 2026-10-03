import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Consent() {
  const { acceptConsent, currentUser } = useApp();
  const [care, setCare] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Screen>
      <Text style={styles.kicker}>Before we begin</Text>
      <Text style={styles.title}>Consent & confidentiality</Text>
      <Text style={styles.body}>
        MindCare is a student wellness companion. It is not emergency medical care. If you are in
        immediate danger, call local emergency services or 988.
      </Text>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>What we store</Text>
        <Text style={styles.body}>
          Your account profile syncs through Firebase. Mood logs, appointments, chats, and your crisis
          plan remain on this device in this version.
        </Text>
      </View>
      <Check row="I understand MindCare is support, not a crisis replacement." value={care} onToggle={() => setCare(!care)} />
      <Check
        row="I agree to campus counseling confidentiality limits (harm to self/others may be shared)."
        value={privacy}
        onToggle={() => setPrivacy(!privacy)}
      />
      <PrimaryButton
        label="I agree, continue"
        disabled={!care || !privacy}
        onPress={async () => {
          if (!currentUser) {
            router.replace('/login');
            return;
          }
          try {
            await acceptConsent();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save your consent.');
            return;
          }
          router.replace(currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)');
        }}
      />
      {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    </Screen>
  );
}

function Check({ row, value, onToggle }: { row: string; value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.check}>
      <View style={[styles.boxMark, value && styles.boxOn]}>{value ? <Text style={{ color: '#fff' }}>✓</Text> : null}</View>
      <Text style={styles.checkText}>{row}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.teal, fontWeight: '700', marginTop: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginVertical: 8 },
  body: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  box: { backgroundColor: colors.white, borderRadius: 18, padding: 16, marginVertical: 16 },
  boxTitle: { fontWeight: '700', color: colors.tealDark, marginBottom: 6 },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  boxMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.teal },
  checkText: { flex: 1, color: colors.text, lineHeight: 20 },
});
