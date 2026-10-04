import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getActiveCounselorId } from '../../lib/counselor';
import type { AppointmentType, CounselorAvailability } from '../../types';

const formatOptions = [
  { key: 'standard', title: '50 min Standard Session', description: 'Comprehensive CBT, stress management, and counseling', duration: '50 min', tag: 'Primary care' },
  { key: 'quick', title: '30 min Quick Check-in', description: 'Follow-up review, breathing exercises, or goal tracking', duration: '30 min' },
  { key: 'urgent', title: '15 min Urgent Crisis Triage', description: 'Immediate intervention slot for high-distress referrals', duration: '15 min', tag: 'SOS hold' },
] as const;

const methods: { key: AppointmentType; title: string }[] = [
  { key: 'video', title: 'Video call' },
  { key: 'chat', title: 'Chat' },
  { key: 'in-person', title: 'In person' },
];

export default function AvailabilitySetup() {
  const { ready, state, currentUser, updateCounselorAvailability } = useApp();
  const counselorId = getActiveCounselorId(currentUser, state.counselors);
  const defaultAvailability = useMemo<CounselorAvailability>(() => ({
    counselorId,
    isAcceptingSessions: true,
    recurringWeekly: true,
    sessionFormats: formatOptions.map((format) => ({ key: format.key, enabled: format.key === 'standard' })),
    deliveryMethods: ['video', 'chat', 'in-person'],
    days: [
      { day: 'Mon', enabled: true, start: '09:00', end: '17:00' },
      { day: 'Tue', enabled: true, start: '09:00', end: '17:00' },
      { day: 'Wed', enabled: true, start: '09:00', end: '17:00' },
      { day: 'Thu', enabled: true, start: '09:00', end: '17:00' },
      { day: 'Fri', enabled: true, start: '09:00', end: '15:00' },
      { day: 'Sat', enabled: false, start: '10:00', end: '14:00' },
      { day: 'Sun', enabled: false, start: '10:00', end: '14:00' },
    ],
  }), [counselorId]);
  const availability = state.availabilities?.find((item) => item.counselorId === counselorId) ?? defaultAvailability;
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [recurringWeekly, setRecurringWeekly] = useState(availability.recurringWeekly ?? true);
  const [isAccepting, setIsAccepting] = useState(availability.isAcceptingSessions);
  const [days, setDays] = useState(availability.days);
  const [selectedFormat, setSelectedFormat] = useState<'standard' | 'quick' | 'urgent'>(
    availability.sessionFormats?.find((format) => format.enabled)?.key ?? 'standard'
  );
  const [deliveryMethods, setDeliveryMethods] = useState<AppointmentType[]>(
    availability.deliveryMethods ?? ['video', 'chat', 'in-person']
  );
  const [saved, setSaved] = useState(false);

  if (!ready) {
    return (
      <Screen>
        <Header title="Availability" onBack={() => router.back()} />
        <Text style={styles.loading}>Loading availability...</Text>
      </Screen>
    );
  }

  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const markDirty = () => setSaved(false);
  const save = () => {
    updateCounselorAvailability(counselorId, {
      counselorId,
      isAcceptingSessions: isAccepting,
      recurringWeekly,
      sessionFormats: formatOptions.map((format) => ({ key: format.key, enabled: format.key === selectedFormat })),
      deliveryMethods,
      days,
    });
    setSaved(true);
  };
  const toggleMethod = (method: AppointmentType) => {
    markDirty();
    setDeliveryMethods((current) => current.includes(method)
      ? current.filter((item) => item !== method)
      : [...current, method]);
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.page}>
        <Header title="Availability" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Set the session times and formats students can book with you.</Text>

          <Card style={styles.card}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.eyebrow}>SELECT DATE</Text>
                <Text style={styles.monthTitle}>
                  {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={20} color={colors.tealDark} />
            </View>
            <View style={styles.dateRow}>
              {week.map((date) => {
                const selected = date.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={date.toDateString()}
                    onPress={() => { markDirty(); setSelectedDate(date); }}
                    style={[styles.dateCell, selected && styles.dateCellSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.dateName, selected && styles.selectedDateText]}>
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateNumber, selected && styles.selectedDateText]}>{date.getDate()}</Text>
                    {selected ? <View style={styles.dateDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.leadingIcon}><Ionicons name="repeat-outline" size={18} color={colors.tealDark} /></View>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Recurring weekly</Text>
                <Text style={styles.rowHint}>
                  Repeat every {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })} for the current term
                </Text>
              </View>
              <Switch
                value={recurringWeekly}
                onValueChange={(value) => { markDirty(); setRecurringWeekly(value); }}
                trackColor={{ false: colors.line, true: colors.teal }}
                thumbColor={colors.white}
              />
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Session format & duration</Text>
          <Card style={styles.card}>
            {formatOptions.map((option, index) => {
              const selected = selectedFormat === option.key;
              const tag = 'tag' in option ? option.tag : undefined;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => { markDirty(); setSelectedFormat(option.key); }}
                  style={[styles.formatRow, index > 0 && styles.divided, selected && styles.formatRowSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioCenter} /> : null}
                  </View>
                  <View style={styles.formatCopy}>
                    <View style={styles.formatTitleRow}>
                      <Text style={styles.rowTitle}>{option.title}</Text>
                      {tag ? (
                        <Text style={[styles.tag, option.key === 'urgent' && styles.urgentTag]}>{tag}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.rowHint}>{option.description}</Text>
                  </View>
                  <Text style={[styles.duration, option.key === 'urgent' && styles.urgentDuration]}>{option.duration}</Text>
                </Pressable>
              );
            })}
          </Card>

          <Text style={styles.sectionTitle}>Delivery method</Text>
          <Card style={styles.methodCard}>
            {methods.map((method) => {
              const selected = deliveryMethods.includes(method.key);
              return (
                <Pressable
                  key={method.key}
                  onPress={() => toggleMethod(method.key)}
                  style={[styles.methodRow, selected && styles.methodRowSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                >
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={selected ? colors.tealDark : colors.muted}
                  />
                  <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{method.title}</Text>
                </Pressable>
              );
            })}
          </Card>

          <Card style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.leadingIcon}><Ionicons name="person-add-outline" size={18} color={colors.tealDark} /></View>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Accepting new sessions</Text>
                <Text style={styles.rowHint}>Let students request an appointment with you.</Text>
              </View>
              <Switch
                value={isAccepting}
                onValueChange={(value) => { markDirty(); setIsAccepting(value); }}
                trackColor={{ false: colors.line, true: colors.teal }}
                thumbColor={colors.white}
              />
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Weekly office hours</Text>
          <Card style={styles.card}>
            {days.map((day, index) => (
              <View key={day.day} style={[styles.officeDay, index > 0 && styles.divided]}>
                <Text style={styles.dayName}>{day.day}</Text>
                <Text style={[styles.officeHours, !day.enabled && styles.unavailable]}>
                  {day.enabled ? `${day.start} – ${day.end}` : 'Unavailable'}
                </Text>
                <Switch
                  value={day.enabled}
                  onValueChange={() => {
                    markDirty();
                    setDays((current) => current.map((item) => item.day === day.day
                      ? { ...item, enabled: !item.enabled }
                      : item));
                  }}
                  trackColor={{ false: colors.line, true: colors.teal }}
                  thumbColor={colors.white}
                />
              </View>
            ))}
          </Card>

          <PrimaryButton label="Save availability" onPress={save} />
          {saved ? (
            <View style={styles.savedMessage}>
              <Ionicons name="checkmark-circle" size={18} color={colors.tealDark} />
              <Text style={styles.savedText}>Availability saved.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  content: { paddingBottom: 28 },
  loading: { color: colors.muted, fontSize: 15 },
  intro: { color: '#53645F', fontSize: 14, fontWeight: '500', lineHeight: 21, marginBottom: 16 },
  card: { padding: 16, marginBottom: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  eyebrow: { color: colors.tealDark, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  monthTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dateCell: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, backgroundColor: colors.bg },
  dateCellSelected: { backgroundColor: colors.teal },
  dateName: { color: '#53645F', fontSize: 13, fontWeight: '600' },
  dateNumber: { color: colors.text, fontSize: 15, fontWeight: '700' },
  selectedDateText: { color: colors.white },
  dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.white },
  toggleRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12 },
  leadingIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.mint },
  toggleCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  rowHint: { color: '#53645F', fontSize: 14, fontWeight: '500', lineHeight: 17 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  formatRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12 },
  formatRowSelected: { backgroundColor: colors.mint, paddingHorizontal: 10 },
  divided: { borderTopWidth: 1, borderTopColor: colors.line },
  radio: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.muted, borderRadius: 11 },
  radioSelected: { borderColor: colors.teal },
  radioCenter: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.teal },
  formatCopy: { flex: 1, gap: 5 },
  formatTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  tag: { overflow: 'hidden', color: '#28695E', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: colors.tealSoft },
  urgentTag: { color: '#98563F', backgroundColor: colors.coralSoft },
  duration: { color: colors.tealDark, fontSize: 14, fontWeight: '700' },
  urgentDuration: { color: colors.coral },
  methodCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, marginBottom: 16 },
  methodRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
  methodRowSelected: { borderColor: colors.teal, backgroundColor: colors.mint },
  methodText: { color: '#53645F', fontSize: 15, fontWeight: '500' },
  methodTextSelected: { color: colors.tealDark, fontWeight: '700' },
  officeDay: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayName: { width: 42, color: colors.text, fontSize: 14, fontWeight: '700' },
  officeHours: { flex: 1, color: colors.text, fontSize: 14 },
  unavailable: { color: colors.muted },
  savedMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  savedText: { color: colors.tealDark, fontSize: 14, fontWeight: '700' },
});
