import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Signup() {
  const { signup, signupAnonymously } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'University email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.';
    if (password.length < 8) next.password = 'Use at least 6 characters.';
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const fail = await signup({ name, email, password, phone });
    if (fail) {
      setErrors({ form: fail });
      return;
    }
    router.replace('/account-created');
  };

  return (
    <Screen padded={false}>
      <View style={styles.page}>
        <View style={styles.brand}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logoImage}
            accessibilityLabel="MindCare logo"
          />
          <Text style={styles.title}>Create Account</Text>
          <View style={styles.privacyPill}>
            <Ionicons name="lock-closed-outline" size={11} color={colors.tealDark} />
            <Text style={styles.privacyText}>End-to-end Encrypted. Campus Invisible</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>UNIVERSITY EMAIL</Text>
              <View style={[styles.inputWrap, errors.email ? styles.inputError : null]}>
                <Ionicons name="school-outline" size={16} color={colors.muted} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@university.edu"
                  placeholderTextColor="#A8BBB6"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {errors.email ? <Text style={styles.error}>{errors.email}</Text> : (
                <Text style={styles.helper}>Used only to create your account.</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[styles.inputWrap, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
                <TextInput
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#A8BBB6"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.muted} />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputWrap, errors.confirm ? styles.inputError : null]}>
                <Ionicons name="refresh-circle-outline" size={16} color={colors.muted} />
                <TextInput
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#A8BBB6"
                  secureTextEntry={!showConfirm}
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                />
                {confirm.length > 0 && confirm === password ? (
                  <Ionicons name="checkmark-circle-outline" size={17} color={colors.teal} />
                ) : (
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showConfirm ? 'Hide confirmation' : 'Show confirmation'}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              {errors.confirm ? <Text style={styles.error}>{errors.confirm}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.phoneLabelRow}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <Text style={styles.optional}>Optional · Confidential SMS</Text>
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={16} color={colors.muted} />
                <TextInput
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#A8BBB6"
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>
          </View>

          {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
          <Pressable onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
            <Text style={styles.submitText}>Sign Up</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={async () => {
              try {
                await signupAnonymously();
                router.replace('/account-created');
              } catch (error) {
                setErrors({ form: error instanceof Error ? error.message : 'Could not create an anonymous account.' });
              }
            }}
            style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.guestIcon}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.tealDark} />
            </View>
            <View style={styles.guestCopy}>
              <Text style={styles.guestTitle}>Continue Anonymously</Text>
              <Text style={styles.guestSub}>No email needed. Continue to the student experience privately.</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.tealDark} />
          </Pressable>
        </View>

        <Text style={styles.foot}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Log in</Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 2, paddingBottom: 20 },
  brand: { alignItems: 'center', marginBottom: 2 },
  logoImage: { width: 44, height: 39, borderRadius: 9 },
  title: { fontSize: 19, fontWeight: '700', color: '#172331', marginTop: 7 },
  privacyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F0ECFA', marginTop: 7 },
  privacyText: { color: '#625489', fontSize: 12, fontWeight: '500' },
  formCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#ECEAE6', borderRadius: 15, padding: 16, shadowColor: '#29473F', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  fields: { gap: 12 },
  fieldGroup: { gap: 5 },
  label: { color: '#3E4B49', fontSize: 12, fontWeight: '600' },
  inputWrap: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#ECEAE6', borderRadius: 10, paddingHorizontal: 10 },
  inputError: { borderColor: colors.coral },
  input: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 13, color: colors.text },
  helper: { color: colors.muted, fontSize: 11, marginTop: 1 },
  error: { color: colors.coral, fontSize: 12 },
  phoneLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optional: { color: colors.muted, fontSize: 11 },
  submit: { minHeight: 38, marginTop: 15, borderRadius: 22, backgroundColor: '#5B9F91', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  pressed: { opacity: 0.82 },
  submitText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 11 },
  dividerLine: { height: 1, backgroundColor: '#F0EFEC', flex: 1 },
  orText: { color: colors.muted, fontSize: 11 },
  guestButton: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#E8F6F4', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 },
  guestIcon: { width: 24, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 8 },
  guestCopy: { flex: 1, gap: 3 },
  guestTitle: { color: '#243630', fontSize: 12, fontWeight: '700' },
  guestSub: { color: '#61716D', fontSize: 12, lineHeight: 13 },
  foot: { textAlign: 'center', marginTop: 14, color: colors.muted, fontSize: 14 },
  link: { color: colors.tealDark, fontWeight: '700' },
});
