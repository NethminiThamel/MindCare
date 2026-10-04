import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { useApp } from '../context/AppContext';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const teal = '#589D8F';

const privacyPoints: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'checkmark-circle', text: 'Your private information is protected by your account settings.' },
  { icon: 'lock-closed', text: 'Your reflections are saved securely to your Firebase account.' },
  { icon: 'people', text: 'Continue anonymously to use a pseudonym with other students.' },
  { icon: 'mail', text: 'You can create an account with your university email at any time.' },
];

export default function Onboarding() {
  const { completeOnboarding, currentUser, introReady, ready, state } = useApp();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  if (!ready || !introReady) {
    return (
      <Screen>
        <Text style={styles.error}>Loading your account...</Text>
      </Screen>
    );
  }
  if (currentUser?.onboardingComplete) {
    return <Redirect href={currentUser.consentAccepted
      ? currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)'
      : '/consent'} />;
  }
  if (!currentUser && state.introCompleted) return <Redirect href="/login" />;

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setError('');
    try {
      await completeOnboarding();
      if (!currentUser) {
        router.replace('/login');
      } else if (!currentUser.consentAccepted) {
        router.replace('/consent');
      } else {
        router.replace(currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save onboarding.');
      setIsFinishing(false);
    }
  };

  const next = () => {
    if (index < 2) setIndex((current) => current + 1);
    else void finish();
  };

  return (
    <Screen scroll={false} padded={false}>
      <LinearGradient colors={['#F7FAF8', '#EAF7F3', '#D8F2EA']} style={styles.page}>
        <View style={styles.artwork}>
          <View pointerEvents="none" style={[styles.ring, styles.outerRing]} />
          <View pointerEvents="none" style={[styles.ring, styles.middleRing]} />
          <View pointerEvents="none" style={[styles.ring, styles.innerRing]} />
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.logo}>MindCare</Text>
            <Text style={styles.tagline}>YOUR MENTAL WELLNESS COMPANION</Text>
          </View>
          <View pointerEvents="none" style={[styles.sparkle, styles.sparkleOne]} />
          <View pointerEvents="none" style={[styles.sparkle, styles.sparkleTwo]} />
          <View pointerEvents="none" style={[styles.sparkle, styles.sparkleThree]} />
        </View>

        <View style={styles.messageArea}>
          {index === 0 ? (
            <View style={styles.featureRow}>
              <Feature icon="book-outline" label="Daily Journal" />
              <Feature icon="leaf-outline" label="Guided Respiration" />
              <Feature icon="analytics-outline" label="Mood Tracking" />
            </View>
          ) : index === 1 ? (
            <View style={styles.guaranteeCard}>
              <View style={styles.guaranteeHeading}>
                <Ionicons name="shield-checkmark-outline" size={17} color="#08796F" />
                <Text style={styles.guaranteeTitle}>A private space, your choice</Text>
              </View>
              {privacyPoints.map((point) => (
                <View key={point.text} style={styles.guaranteeRow}>
                  <View style={styles.pointIcon}>
                    <Ionicons name={point.icon} size={12} color="#2B887C" />
                  </View>
                  <Text style={styles.guaranteeText}>{point.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.tailoredCard}>
              <Text style={styles.tailoredTitle}>Tailored to Your Emotional Rhythm</Text>
              <Text style={styles.tailoredBody}>
                Personalised practices that adapt to how you feel each morning and evening.
              </Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <View style={styles.footer}>
          <View style={styles.pagination} accessibilityLabel={`Onboarding screen ${index + 1} of 3`}>
            {[0, 1, 2].map((step) => (
              <View key={step} style={[styles.dot, index === step && styles.activeDot]} />
            ))}
          </View>
          {index === 0 ? (
            <View style={styles.firstActions}>
              <Pressable
                onPress={() => void finish()}
                disabled={isFinishing}
                style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <ActionButton label={isFinishing ? 'Saving...' : 'Next'} onPress={next} disabled={isFinishing} arrow expand />
            </View>
          ) : (
            <ActionButton
              label={index === 2 ? (isFinishing ? 'Saving...' : 'Get Started') : 'Next'}
              onPress={next}
              disabled={isFinishing}
            />
          )}
        </View>
      </LinearGradient>
    </Screen>
  );
}

function Feature({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={12} color="#357B70" />
      <Text style={styles.featureText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  arrow = false,
  expand = false,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  arrow?: boolean;
  expand?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        expand && styles.expandedAction,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={styles.actionText}>{label}</Text>
      {arrow ? <Ionicons name="arrow-forward" size={16} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
  artwork: { flex: 1.35, minHeight: 230, justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', aspectRatio: 1, borderRadius: 500, alignSelf: 'center' },
  outerRing: { top: '0%', width: '98%', borderWidth: 1, borderColor: 'rgba(81, 125, 119, 0.15)' },
  middleRing: { top: '12%', width: '76%', borderWidth: 1, borderColor: 'rgba(81, 125, 119, 0.22)' },
  innerRing: { top: '24%', width: '56%', borderWidth: 1, borderColor: 'rgba(81, 125, 119, 0.2)' },
  brand: { alignItems: 'center', zIndex: 1 },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: teal,
    marginBottom: 6,
  },
  logo: { color: '#193D3B', fontFamily: SERIF, fontSize: 37, lineHeight: 43 },
  tagline: { color: '#365957', fontSize: 9, fontWeight: '600', letterSpacing: 0.55, marginTop: 4 },
  sparkle: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#45BFB2' },
  sparkleOne: { left: '14%', top: '52%' },
  sparkleTwo: { right: '14%', top: '63%' },
  sparkleThree: { right: '32%', bottom: '5%' },
  messageArea: { flex: 0.95, justifyContent: 'center', minHeight: 114 },
  featureRow: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  feature: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(84, 157, 143, 0.18)',
    borderRadius: 15,
    backgroundColor: 'rgba(216, 242, 234, 0.72)',
  },
  featureText: { color: '#356A63', fontSize: 9 },
  guaranteeCard: {
    borderWidth: 1.5,
    borderColor: '#08796F',
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 9,
  },
  guaranteeHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 1 },
  guaranteeTitle: { color: '#163C38', fontSize: 14, fontWeight: '700' },
  guaranteeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointIcon: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9F1EB',
  },
  guaranteeText: { flex: 1, color: '#27433F', fontSize: 10, lineHeight: 14 },
  tailoredCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#08796F',
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  tailoredTitle: {
    color: '#163C38',
    fontFamily: SERIF,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  tailoredBody: { color: '#687672', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  error: { color: '#A8313B', fontSize: 12, textAlign: 'center', marginVertical: 3 },
  footer: { flex: 0.76, minHeight: 88, justifyContent: 'flex-end', gap: 18, paddingBottom: 2 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A7A6BE' },
  activeDot: { width: 22, backgroundColor: '#064D48' },
  firstActions: { flexDirection: 'row', gap: 9 },
  skipButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#E0EAE6',
  },
  skipText: { color: '#24443E', fontSize: 13, fontWeight: '600' },
  actionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    backgroundColor: teal,
    elevation: 3,
  },
  expandedAction: { flex: 1 },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.65 },
  pressed: { opacity: 0.82 },
});
