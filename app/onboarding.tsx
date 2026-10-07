import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Screen } from '../components/ui';
import { useApp } from '../context/AppContext';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const privacyPoints: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'checkmark', text: 'No one will be able to see your private information' },
  {
    icon: 'lock-closed-outline',
    text: 'Locally encrypted: Your reflections and emotion logs remain stored strictly on this device.',
  },
  {
    icon: 'footsteps-outline',
    text: 'Just Sign Up with Continue Anonymous and we will take care of the rest',
  },
  { icon: 'mail-outline', text: 'You will be anonymous user to all others' },
];

// Shared center of the artwork (fraction of page height)
const CENTER_Y_FIRST = 0.31; // screen 1
const CENTER_Y_OTHER = 0.285; // screens 2 and 3 sit slightly higher
// Top of the white card on screens 2 and 3 (fraction of page height)
const CARD_TOP = 0.41;
// Brand block height (logo 42 + gap 8 + title 42 + gap 8 + tagline ~13)
const BRAND_HEIGHT = 113;

// Concentric rings: diameter as a fraction of page width
const RINGS = [
  { d: 0.84, color: 'rgba(95, 125, 121, 0.26)' },
  { d: 0.68, color: 'rgba(95, 125, 121, 0.22)' },
  { d: 0.52, color: 'rgba(95, 125, 121, 0.18)' },
];

// Tiny decorative dots (fractions of page width / height)
const DOTS = [
  { x: 0.16, y: 0.3, teal: false },
  { x: 0.81, y: 0.34, teal: true },
  { x: 0.29, y: 0.44, teal: false },
  { x: 0.73, y: 0.45, teal: false },
  { x: 0.21, y: 0.66, teal: false },
  { x: 0.78, y: 0.6, teal: false },
  { x: 0.6, y: 0.77, teal: false },
];

export default function Onboarding() {
  const { completeOnboarding, currentUser, introReady, ready, state } = useApp();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const window = useWindowDimensions();
  const [size, setSize] = useState({ w: window.width, h: window.height });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  if (!ready || !introReady) {
    return (
      <Screen>
        <Text style={styles.error}>Loading your account...</Text>
      </Screen>
    );
  }
  if (currentUser?.onboardingComplete) {
    return <Redirect href={currentUser.consentAccepted
      ? currentUser.role === 'admin'
        ? '/admin'
        : currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)'
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
        router.replace(
          currentUser.role === 'admin'
            ? '/admin'
            : currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)'
        );
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

  const { w, h } = size;
  const centerX = w / 2;
  const centerY = h * (index === 0 ? CENTER_Y_FIRST : CENTER_Y_OTHER);
  const visibleDots = index === 0 ? DOTS : DOTS.filter((dot) => dot.y >= 0.6);

  return (
    <Screen scroll={false} padded={false}>
      <LinearGradient
        colors={['#F8FAF9', '#F6F9F8', '#F1F9F6']}
        style={styles.page}
        onLayout={onLayout}
      >
        {/* Glows + rings in one SVG layer so they share the same coordinates */}
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="obTeal" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#3F8E95" stopOpacity="0.6" />
              <Stop offset="0.45" stopColor="#6DB3B2" stopOpacity="0.32" />
              <Stop offset="1" stopColor="#A7D8D2" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="obMint" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#A9EAD7" stopOpacity="0.75" />
              <Stop offset="0.6" stopColor="#C6F1E4" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#E8F9F4" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* teal haze behind logo */}
          <Ellipse cx={w * 0.45} cy={centerY} rx={w * 0.6} ry={w * 0.6} fill="url(#obTeal)" />
          {/* mint glow bottom-right */}
          <Ellipse cx={w * 0.78} cy={h * 0.77} rx={w * 0.7} ry={h * 0.22} fill="url(#obMint)" />
          {/* faint mint bottom-left */}
          <Ellipse
            cx={w * 0.25}
            cy={h * 0.85}
            rx={w * 0.5}
            ry={h * 0.14}
            fill="url(#obMint)"
            opacity={0.5}
          />

          {/* Concentric rings */}
          {RINGS.map((ring, i) => (
            <Circle
              key={i}
              cx={centerX}
              cy={centerY}
              r={(w * ring.d) / 2}
              stroke={ring.color}
              strokeWidth={1}
              fill="none"
            />
          ))}
        </Svg>

        {/* Dots */}
        {visibleDots.map((dot, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.sparkle,
              { left: w * dot.x, top: h * dot.y },
              dot.teal && { backgroundColor: '#48A7A0', opacity: 1 },
            ]}
          />
        ))}

        {/* Brand, centered on the same point as the rings */}
        <View style={[styles.brand, { top: centerY - BRAND_HEIGHT / 2 }]} pointerEvents="none">
          <View style={styles.logoBadge}>
            <Image
              source={require('../assets/images/logo.jpg')}
              style={styles.logoImage}
              accessibilityLabel="MindCare logo"
            />
          </View>
          <Text style={styles.logo}>MindCare</Text>
          <Text style={styles.tagline}>YOUR MENTAL WELLNESS COMPANION</Text>
        </View>

        {/* Cards for screens 2 and 3 sit right under the brand */}
        {index === 1 ? (
          <View style={[styles.cardWrap, { top: h * CARD_TOP }]}>
            <View style={styles.guaranteeCard}>
              <View style={styles.guaranteeHeading}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#1F2B2E" />
                <Text style={styles.guaranteeTitle}>Anonymous Sign Up Guarantee</Text>
              </View>
              <View style={styles.guaranteeBody}>
                {privacyPoints.map((point) => (
                  <View key={point.text} style={styles.guaranteeRow}>
                    <View style={styles.pointIcon}>
                      <Ionicons name={point.icon} size={11} color="#3E8C80" />
                    </View>
                    <Text style={styles.guaranteeText}>{point.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {index === 2 ? (
          <View style={[styles.cardWrap, { top: h * CARD_TOP }]}>
            <View style={styles.tailoredCard}>
              <Text style={styles.tailoredTitle}>Tailored to Your Emotional Rhythm</Text>
              <Text style={styles.tailoredBody}>
                Personalized practices that adapt to how you feel each morning and evening.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Pushes the content below to the bottom */}
        <View style={styles.spacer} />

        {index === 0 ? (
          <View style={styles.messageArea}>
            <View style={styles.featureRow}>
              <Feature label="Daily Journal" />
              <Feature label="Guided Respiration" />
              <Feature label="Mood Tracking" />
            </View>
          </View>
        ) : null}

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
              <ActionButton
                label={isFinishing ? 'Saving...' : 'Next'}
                onPress={next}
                disabled={isFinishing}
                arrow
                expand
              />
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

function Feature({ label }: { label: string }) {
  return (
    <View style={styles.feature}>
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
  page: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 24,
    backgroundColor: '#F6F9F8',
  },
  spacer: { flex: 1 },
  sparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4F6A72',
    opacity: 0.6,
  },
  brand: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#5E9E92',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  logo: {
    color: '#1F2B2E',
    fontFamily: SERIF,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -1,
  },
  tagline: {
    color: '#1F2B2E',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.7,
    marginTop: 8,
  },

  // Screen 1
  messageArea: { justifyContent: 'flex-end', paddingBottom: 10 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feature: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(84, 157, 143, 0.28)',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  featureText: { color: '#2F5F58', fontSize: 9.5, fontWeight: '600', letterSpacing: 0.2 },

  // Screens 2 and 3
  cardWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  guaranteeCard: {
    borderWidth: 1.5,
    borderColor: '#0B6B63',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    elevation: 2,
    shadowColor: '#1F413E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  guaranteeHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 9,
    marginBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EAE8',
  },
  guaranteeTitle: { color: '#1F2B2E', fontSize: 16, fontWeight: '600' },
  guaranteeBody: { gap: 11 },
  guaranteeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1EEEA',
  },
  guaranteeText: { flex: 1, color: '#1F2B2E', fontSize: 11, lineHeight: 15 },
  tailoredCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderWidth: 1.5,
    borderColor: '#0B6B63',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.97)',
    elevation: 2,
    shadowColor: '#1F413E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tailoredTitle: {
    color: '#1F2B2E',
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  tailoredBody: {
    color: '#5F6B69',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
  },

  error: { color: '#A8313B', fontSize: 12, textAlign: 'center', marginVertical: 3 },
  footer: {
    justifyContent: 'flex-end',
    gap: 22,
  },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#B4B9C6' },
  activeDot: { width: 28, backgroundColor: '#0B4B46' },
  firstActions: { flexDirection: 'row', gap: 12 },
  skipButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#1F413E',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  skipText: { color: '#1F2B2E', fontSize: 15, fontWeight: '600' },
  actionButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 27,
    backgroundColor: '#5A9C8E',
    elevation: 3,
    shadowColor: '#2B7671',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  expandedAction: { flex: 1 },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.65 },
  pressed: { opacity: 0.82 },
});