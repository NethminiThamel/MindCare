import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GhostButton, PrimaryButton } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

const slides = [
  {
    title: 'You are not alone on campus',
    body: 'Book licensed counselors, keep a private mood log, and reach help quickly when things spike.',
  },
  {
    title: 'Check in with how you feel',
    body: 'Daily mood tracking turns fuzzy weeks into a picture you and your counselor can actually use.',
  },
  {
    title: 'Support that fits student life',
    body: 'Video sessions, chat, reminders, and a crisis plan you control — all in one calm place.',
  },
];

export default function Onboarding() {
  const { completeOnboarding, currentUser } = useApp();
  const [i, setI] = useState(0);
  const [error, setError] = useState('');
  const slide = slides[i];

  const finish = async () => {
    try {
      await completeOnboarding();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
      return;
    }
    if (!currentUser) {
      router.replace('/login');
    } else if (!currentUser.consentAccepted) {
      router.replace('/consent');
    } else {
      router.replace(currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)');
    }
  };

  const next = () => {
    if (i < slides.length - 1) {
      setI(i + 1);
      return;
    }
    finish();
  };

  return (
    <LinearGradient colors={['#C9EFE4', '#F3FAF7']} style={styles.wrap}>
      <Text style={styles.logo}>MindCare</Text>
      <View style={styles.card}>
        <Text style={styles.kicker}>0{i + 1} / 03</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
        <View style={styles.dots}>
          {slides.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === i && styles.dotOn]} />
          ))}
        </View>
        <PrimaryButton label={i === slides.length - 1 ? 'Get started' : 'Continue'} onPress={next} />
        {i < slides.length - 1 ? (
          <GhostButton
            label="Skip"
            onPress={finish}
          />
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
  logo: { color: colors.tealDark, fontWeight: '800', fontSize: 22, marginBottom: 24, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 24, gap: 14 },
  kicker: { color: colors.teal, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 34 },
  body: { fontSize: 16, color: colors.muted, lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.teal },
});
