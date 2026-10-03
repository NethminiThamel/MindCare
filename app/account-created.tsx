import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function AccountCreated() {
  const { currentUser } = useApp();

  useEffect(() => {
    const destination = !currentUser?.onboardingComplete
      ? '/onboarding'
      : !currentUser.consentAccepted
        ? '/consent'
        : currentUser.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)';
    const timer = setTimeout(() => router.replace(destination), 3000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.successMark}>
            <Ionicons name="checkmark" size={24} color={colors.white} />
          </View>
          <Text style={styles.title}>Account Created!</Text>
          <Text style={styles.body}>
            Welcome onboard. Your account has been successfully created. Let&apos;s begin your journey.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14 },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E4ECE8',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: '#29473F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  successMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#78B98E',
    marginBottom: 18,
  },
  title: { color: '#30433D', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { color: '#73847E', fontSize: 12, lineHeight: 15, textAlign: 'center', marginTop: 10 },
});
