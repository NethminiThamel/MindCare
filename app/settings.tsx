import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { BackHeader, Card, PrimaryButton, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { currentUser, state, updateProfile, updateSettings } = useApp();
  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const savedSettings = state.settings.find((setting) => setting.userId === currentUser?.id);
  const [shareEmergencyStatus, setShareEmergencyStatus] = useState(savedSettings?.shareEmergencyStatus ?? false);
  const [error, setError] = useState('');

  if (!currentUser) return null;

  const save = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Enter your full name.');
      return;
    }

    setError('');
    try {
      await updateProfile({ name: normalizedName, phone: phone.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
      return;
    }
    updateSettings({ shareEmergencyStatus });
    router.replace({
      pathname: '/done',
      params: {
        flow: 'profile',
        href: '/(tabs)/profile',
      },
    });
  };

  return (
    <Screen>
      <BackHeader title="Profile & Privacy" />
      <Text style={styles.lead}>Keep your personal details up to date and choose what to share.</Text>

      <Card style={styles.formCard}>
        <ProfileField label="FULL NAME" value={name} onChangeText={setName} placeholder="Full name" />
        <ProfileField
          label="PHONE NUMBER"
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
        <ProfileField
          label="ACCOUNT EMAIL"
          value={currentUser.email}
          editable={false}
        />
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        <PrimaryButton label="Update" onPress={save} />
      </Card>

      <Card style={styles.sharingCard}>
        <View style={styles.sharingHeader}>
          <View style={styles.sharingCopy}>
            <Text style={styles.sharingTitle}>Share emergency status</Text>
            <Text style={styles.sharingHint}>
              Allow MindCare to share your emergency status with your trusted contacts.
            </Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.tealDark} />
        </View>
        <View style={styles.sharingFooter}>
          <Text style={styles.sharingState}>
            {shareEmergencyStatus ? 'Emergency alerts enabled' : 'Emergency alerts disabled'}
          </Text>
          <Switch
            value={shareEmergencyStatus}
            onValueChange={setShareEmergencyStatus}
            trackColor={{ false: colors.line, true: '#5BA48F' }}
            thumbColor={colors.white}
          />
        </View>
      </Card>
    </Screen>
  );
}

function ProfileField({
  label,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  formCard: { gap: 12, padding: 16, borderRadius: 18, marginBottom: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  input: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#F6F9F8', color: colors.text, fontSize: 14 },
  error: { color: colors.coral, fontSize: 14 },
  sharingCard: { padding: 16, borderRadius: 18 },
  sharingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sharingCopy: { flex: 1, gap: 6 },
  sharingTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sharingHint: { color: colors.muted, fontSize: 15, lineHeight: 18 },
  sharingFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  sharingState: { color: colors.muted, fontSize: 14 },
});
