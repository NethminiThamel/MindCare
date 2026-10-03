import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function Splash() {
  const { ready, currentUser, state } = useApp();
  const [progressAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progressAnim]);

  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      const route = !state.introCompleted || (currentUser && !currentUser.onboardingComplete)
        ? '/onboarding'
        : currentUser
          ? currentUser.consentAccepted
            ? currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)'
            : '/consent'
          : '/login';
      router.replace(route);
    }, 1200);

    return () => clearTimeout(timer);
  }, [ready, currentUser, state.introCompleted]);

  if (!ready) {
    return <View style={styles.splash} />;
  }

  return (
    <View style={styles.splash}>
      {/* Soft Ambient Radial Background Glows */}
      <View style={styles.glowCenterContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(124, 214, 200, 0.45)', 'rgba(206, 241, 234, 0.15)', 'rgba(245, 250, 248, 0)']}
          style={styles.glowCenter}
        />
      </View>

      <View style={styles.glowBottomContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(160, 229, 217, 0.55)', 'rgba(220, 246, 241, 0.20)', 'rgba(245, 250, 248, 0)']}
          style={styles.glowBottom}
        />
      </View>

      {/* Decorative Concentric Rings */}
      <View style={styles.ringOuter} pointerEvents="none" />
      <View style={styles.ringMiddle} pointerEvents="none" />
      <View style={styles.ringInner} pointerEvents="none" />

      {/* Small Floating Dots */}
      <View style={[styles.dot, styles.dot1]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot2]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot3]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot4]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot5]} pointerEvents="none" />

      {/* Centered Brand Content */}
      <View style={styles.centerContent} pointerEvents="none">
        {/* Teal Logo Squircle Badge */}
        <View style={styles.logoBadge}>
          <Ionicons name="heart-outline" size={30} color="#FFFFFF" />
        </View>

        <Text style={styles.titleText}>MindCare</Text>
        <Text style={styles.subtitleText}>YOUR MENTAL WELLNESS COMPANION</Text>
      </View>

      {/* Bottom Progress Bar & Caption */}
      <View style={styles.footerContainer} pointerEvents="none">
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                transform: [
                  {
                    translateX: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-110, 0],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.captionText}>Entering your serene space...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#EEF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCenterContainer: {
    position: 'absolute',
    top: '19%',
    width: 420,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCenter: {
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.8,
  },
  glowBottomContainer: {
    position: 'absolute',
    bottom: -80,
    width: 480,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBottom: {
    width: 480,
    height: 260,
    borderRadius: 220,
  },
  ringOuter: {
    position: 'absolute',
    top: '18%',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(78, 126, 121, 0.28)',
  },
  ringMiddle: {
    position: 'absolute',
    top: '22%',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(78, 126, 121, 0.22)',
  },
  ringInner: {
    position: 'absolute',
    top: '26%',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(78, 126, 121, 0.18)',
  },
  dot: {
    position: 'absolute',
    borderRadius: 4,
  },
  dot1: { top: '24%', left: '32%', width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4ED0C4' },
  dot2: { top: '30%', right: '22%', width: 4, height: 4, borderRadius: 2, backgroundColor: '#4ED0C4' },
  dot3: { top: '36%', left: '18%', width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#526462' },
  dot4: { top: '48%', right: '20%', width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#526462' },
  dot5: { top: '65%', right: '35%', width: 4.5, height: 4.5, borderRadius: 2.5, backgroundColor: '#38CBBF' },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: 16,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#3F9C96',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#2F665F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  titleText: {
    fontFamily: SERIF,
    fontSize: 54,
    fontWeight: '400',
    color: '#1F3C3B',
    letterSpacing: -1.2,
    lineHeight: 60,
  },
  subtitleText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: '#4A6765',
    textAlign: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 10,
    backgroundColor: '#CFE8E4',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#3F9C96',
  },
  captionText: {
    marginTop: 18,
    fontSize: 14,
    color: '#5B7270',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});
