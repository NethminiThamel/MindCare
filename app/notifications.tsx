import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BackHeader, Card, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { AppSettings } from '../types';

export default function Notifications() {
  const { currentUser, ready, state, updateSettings } = useApp();
  const savedSettings = state.settings.find((item) => item.userId === currentUser?.id);

  if (!ready) {
    return (
      <Screen>
        <BackHeader title="Notification Settings" />
        <Text style={styles.description}>Loading your notification preferences...</Text>
      </Screen>
    );
  }

  return (
    <NotificationSettings
      key={currentUser?.id ?? 'guest'}
      savedSettings={savedSettings}
      updateSettings={updateSettings}
    />
  );
}

function NotificationSettings({
  savedSettings,
  updateSettings,
}: {
  savedSettings: AppSettings | undefined;
  updateSettings: (patch: Partial<AppSettings>) => void;
}) {
  const [appointmentReminders, setAppointmentReminders] = useState(savedSettings?.appointmentReminders ?? true);
  const [sameDayAlerts, setSameDayAlerts] = useState(savedSettings?.sameDayAlerts ?? false);
  const [chatAlerts, setChatAlerts] = useState(savedSettings?.chatAlerts ?? true);
  const [wellnessCheckIns, setWellnessCheckIns] = useState(
    savedSettings?.wellnessCheckIns ?? savedSettings?.moodReminders ?? true
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(savedSettings?.quietHoursEnabled ?? false);
  const [quietHoursStart, setQuietHoursStart] = useState(savedSettings?.quietHoursStart ?? '22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState(savedSettings?.quietHoursEnd ?? '07:00');
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({
      appointmentReminders,
      sameDayAlerts,
      chatAlerts,
      wellnessCheckIns,
      moodReminders: wellnessCheckIns,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <BackHeader title="Notification Settings" />
      <Text style={styles.description}>
        Choose your reminder preferences. Push notification delivery is not enabled in this demo.
      </Text>

      <Text style={styles.groupLabel}>APPOINTMENT ALERTS</Text>
      <Card style={styles.groupCard}>
        <SettingRow
          label="Upcoming Session Reminders"
          hint="Get notified 24 hours before your session"
          value={appointmentReminders}
          onValueChange={(value) => { setSaved(false); setAppointmentReminders(value); }}
        />
        <SettingRow
          label="Same-Day Alert"
          hint="Receive a final notification 2 hours prior"
          value={sameDayAlerts}
          onValueChange={(value) => { setSaved(false); setSameDayAlerts(value); }}
          last
        />
      </Card>

      <Text style={styles.groupLabel}>COUNSELOR MESSAGING</Text>
      <Card style={styles.groupCard}>
        <SettingRow
          label="New Message Alerts"
          hint="Instant alerts for secure responses"
          value={chatAlerts}
          onValueChange={(value) => { setSaved(false); setChatAlerts(value); }}
        />
        <SettingRow
          label="Wellness Check-ins"
          hint="Periodic gentle mental health prompts"
          value={wellnessCheckIns}
          onValueChange={(value) => { setSaved(false); setWellnessCheckIns(value); }}
          last
        />
      </Card>

      <Text style={styles.groupLabel}>QUIET HOURS</Text>
      <Card style={styles.quietCard}>
        <SettingRow
          label="Do Not Disturb"
          hint="Silence alerts during specified times"
          value={quietHoursEnabled}
          onValueChange={(value) => { setSaved(false); setQuietHoursEnabled(value); }}
          last
        />
        <View style={[styles.quietTimes, !quietHoursEnabled && styles.quietTimesDisabled]}>
          <TimePill
            value={quietHoursStart}
            disabled={!quietHoursEnabled}
            accessibilityLabel="Quiet hours start time"
            onPress={() => { setSaved(false); setQuietHoursStart((value) => adjustHour(value)); }}
          />
          <Text style={styles.toText}>to</Text>
          <TimePill
            value={quietHoursEnd}
            disabled={!quietHoursEnabled}
            accessibilityLabel="Quiet hours end time"
            onPress={() => { setSaved(false); setQuietHoursEnd((value) => adjustHour(value)); }}
          />
        </View>
        <Text style={styles.quietHint}>Tap a time to adjust it by one hour. Times are local.</Text>
      </Card>

      <Pressable
        onPress={save}
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>Save Settings</Text>
      </Pressable>
      {saved ? (
        <View style={styles.savedMessage}>
          <Ionicons name="checkmark-circle" size={17} color={colors.tealDark} />
          <Text style={styles.savedText}>Settings saved</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function SettingRow({
  label,
  hint,
  value,
  onValueChange,
  last = false,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.divider]}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#DDE6E3', true: '#5BA48F' }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function TimePill({
  value,
  disabled,
  accessibilityLabel,
  onPress,
}: {
  value: string;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const [hour, minute] = value.split(':').map(Number);
  const formattedTime = Number.isFinite(hour) && Number.isFinite(minute)
    ? new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : value;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.timePill, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}: ${formattedTime}`}
      accessibilityState={{ disabled }}
    >
      <Text style={styles.timeText}>{formattedTime}</Text>
    </Pressable>
  );
}

function adjustHour(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  description: { color: colors.muted, fontSize: 15, lineHeight: 19, marginBottom: 12 },
  groupLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 9, marginBottom: 7 },
  groupCard: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 16, marginBottom: 10 },
  settingRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  settingCopy: { flex: 1, gap: 3 },
  settingLabel: { color: '#344A45', fontSize: 15, fontWeight: '600' },
  settingHint: { color: colors.muted, fontSize: 13, lineHeight: 15 },
  quietCard: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 16, marginBottom: 14 },
  quietTimes: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 },
  quietTimesDisabled: { opacity: 0.5 },
  timePill: { paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: '#F7FAF9' },
  timeText: { color: colors.muted, fontSize: 13 },
  toText: { color: colors.muted, fontSize: 14 },
  quietHint: { color: colors.muted, fontSize: 12, paddingBottom: 10 },
  saveButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#5BA48F' },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  savedMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  savedText: { color: colors.tealDark, fontSize: 14, fontWeight: '600' },
});
