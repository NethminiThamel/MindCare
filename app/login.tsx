import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { validateEmail } from '../utils/formValidation';

export default function Login() {
  const { authStartupError, login, resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = { email: validateEmail(email) };
    if (!password) next.password = 'Password is required.';
    if (next.email || next.password) {
      setErrors(next);
      return;
    }

    const result = await login(email, password);
    if (result.error) {
      setErrors({ form: result.error });
      return;
    }

    const destination = !result.onboardingComplete
      ? '/onboarding'
      : !result.consentAccepted
        ? '/consent'
      : result.role === 'admin'
        ? '/admin'
        : result.role === 'counselor' ? '/(counselor-tabs)' : '/(tabs)';
    router.replace(destination);
  };

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.brand}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logoImage}
            accessibilityLabel="MindCare logo"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with your email and password, including anonymous accounts</Text>
          <View style={styles.privacyPill}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.tealDark} />
            <Text style={styles.privacyText}>End-to-end Encrypted. Campus Invisible</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>UNIVERSITY EMAIL</Text>
              <Text style={styles.fieldHint}>Student Verified</Text>
            </View>
            <View style={[styles.inputWrap, errors.email ? styles.inputError : null]}>
              <Ionicons name="school-outline" size={17} color={colors.muted} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@university.edu"
                placeholderTextColor="#A8BBB6"
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setErrors((current) => ({
                    ...current,
                    email: validateEmail(value),
                    form: undefined,
                  }));
                }}
                accessibilityLabel="University email"
              />
            </View>
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : (
              <Text style={styles.helper}>Used solely for your account sign in.</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <Pressable
                onPress={async () => {
                  const normalizedEmail = email.trim().toLowerCase();
                  const emailError = validateEmail(normalizedEmail);
                  if (emailError) {
                    setErrors((current) => ({ ...current, email: emailError }));
                    return;
                  }
                  const error = await resetPassword(normalizedEmail);
                  Alert.alert(
                    error ? 'Password reset failed' : 'Check your email',
                    error ?? 'If an account exists for this address, Firebase will send a password reset link.'
                  );
                }}
                accessibilityRole="button"
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrap, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.muted} />
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Enter your password"
                placeholderTextColor="#A8BBB6"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrors((current) => ({
                    ...current,
                    password: value ? undefined : 'Password is required.',
                    form: undefined,
                  }));
                }}
                onSubmitEditing={submit}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword((visible) => !visible)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          {authStartupError ? <Text style={styles.formError}>{authStartupError}</Text> : null}
          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <Pressable
            onPress={submit}
            style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>Log In</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.foot}>
          Don&apos;t have an account? <Link href="/signup" style={styles.link}>Create one</Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 2, paddingTop: 22, paddingBottom: 24, gap: 16 },
  brand: { alignItems: 'center', alignSelf: 'stretch', marginBottom: 2 },
  logoImage: { width: 52, height: 46, borderRadius: 10, marginBottom: 10 },
  title: {
    color: '#182333',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
    includeFontPadding: false,
  },
  subtitle: { color: '#53615D', fontSize: 15, textAlign: 'center', marginTop: 4 },
  privacyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14, backgroundColor: '#F1EFF8', marginTop: 11 },
  privacyText: { color: '#60627B', fontSize: 12, fontWeight: '500' },
  formCard: { gap: 15, padding: 16, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: '#EAECE9', shadowColor: '#263B36', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  fieldGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#52605D', fontSize: 12, fontWeight: '700', letterSpacing: 0.35 },
  fieldHint: { color: colors.tealDark, fontSize: 12, fontWeight: '600' },
  forgotText: { color: colors.tealDark, fontSize: 12, fontWeight: '600' },
  inputWrap: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, borderWidth: 1, borderColor: '#E3E7E4', borderRadius: 12, backgroundColor: colors.white },
  inputError: { borderColor: colors.coral },
  input: { flex: 1, minWidth: 0, paddingVertical: 10, color: colors.text, fontSize: 15 },
  helper: { color: '#7B8985', fontSize: 12, marginLeft: 3 },
  error: { color: colors.coral, fontSize: 13 },
  formError: { color: colors.coral, fontSize: 14, fontWeight: '600' },
  submit: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, backgroundColor: '#5BA48F', marginTop: 1 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  foot: { color: '#53615D', textAlign: 'center', fontSize: 14, marginTop: 160 },
  link: { color: colors.tealDark, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});