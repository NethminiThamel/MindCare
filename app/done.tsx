import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { formatTime } from '../lib/format';

export default function Done() {
  const { state } = useApp();
  const { title, body, href, appointmentId, flow, contactId, returnTo } = useLocalSearchParams<{
    title?: string;
    body?: string;
    href?: string;
    appointmentId?: string;
    flow?: 'reschedule' | 'cancel' | 'trusted-contact' | 'profile' | 'feedback';
    contactId?: string;
    returnTo?: string;
  }>();
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  const counselor = appointment
    ? state.counselors.find((item) => item.id === appointment.counselorId)
    : undefined;
  const trustedContact = state.contacts.find((contact) => contact.id === contactId);
  const feedback = state.feedback.find((item) => item.appointmentId === appointmentId);

  if (appointment && counselor && flow === 'feedback') {
    const sessionDate = new Date(`${appointment.date}T12:00:00`);
    const dateLabel = sessionDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return (
      <Screen padded={false}>
        <View style={styles.feedbackConfirmation}>
          <View style={styles.feedbackSuccessCard}>
            <View style={styles.feedbackBadgeOuter}>
              <View style={styles.feedbackBadgeInner}>
                <Ionicons name="checkmark" size={26} color={colors.white} />
              </View>
            </View>
            <Text style={styles.feedbackTitle}>Feedback Submitted</Text>
            <Text style={styles.feedbackBody}>
              Your reflections have been saved to your Firebase account. Taking time to process and share your thoughts is an important step in your wellbeing journey.
            </Text>
            <View style={styles.feedbackDetails}>
              <View style={styles.feedbackDetailRow}>
                <Ionicons name="person-circle-outline" size={17} color={colors.tealDark} />
                <View style={styles.feedbackDetailCopy}>
                  <Text style={styles.feedbackDetailTitle}>Session with {counselor.name}</Text>
                  <Text style={styles.feedbackDetailSub}>{counselor.specialties[0]} · {dateLabel}</Text>
                </View>
              </View>
              <View style={styles.feedbackPrivacyRow}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.tealDark} />
                <Text style={styles.feedbackPrivacyLabel}>Feedback display</Text>
                <Text style={styles.feedbackPrivacyValue}>
                  {feedback?.hideNameFromCounselor ? 'Name hidden' : 'Name visible'}
                </Text>
              </View>
            </View>
            <View style={styles.feedbackReminder}>
              <Ionicons name="water-outline" size={17} color="#7564A3" />
              <Text style={styles.feedbackReminderText}>Take a moment to unwind. A little water and a few deep breaths can help after a session.</Text>
            </View>
            <Pressable onPress={() => router.replace('/appointments')} style={styles.feedbackContinue} accessibilityRole="button">
              <Text style={styles.feedbackContinueText}>Back to appointments</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  if (trustedContact && flow === 'trusted-contact') {
    const initials = trustedContact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
    const maskedPhone = trustedContact.phone.replace(/\d(?=\d{4})/g, '*');
    return (
      <Screen padded={false}>
        <View style={styles.flowConfirmation}>
          <View style={styles.cancelCard}>
            <View style={styles.phoneBadge}><Ionicons name="checkmark" size={21} color={colors.tealDark} /></View>
            <Text style={styles.flowTitle}>Trusted Contact Saved</Text>
            <Text style={styles.flowBody}>
              {trustedContact.name} has been registered as your safe emergency connection. {trustedContact.shareEmergencyStatus ? 'Emergency status sharing is enabled.' : 'We will only share information with your consent.'}
            </Text>
            <View style={styles.trustedContactRow}>
              <View style={styles.initialsBadge}><Text style={styles.initialsText}>{initials}</Text></View>
              <View style={styles.counselorInfo}>
                <Text style={styles.counselorName}>{trustedContact.name} ({trustedContact.relation})</Text>
                <Text style={styles.counselorTitle}>{maskedPhone}</Text>
                {trustedContact.email ? <Text style={styles.counselorTitle}>{trustedContact.email}</Text> : null}
              </View>
              <Ionicons name="shield-checkmark" size={14} color={colors.tealDark} />
            </View>
          </View>
          <Pressable
            onPress={() => router.replace({
              pathname: '/trusted-contacts',
              params: {
                returnTo: returnTo === '/(tabs)/profile' || returnTo === '/(tabs)/sos'
                  ? returnTo
                  : '/(tabs)',
              },
            })}
            style={styles.flowAction}
            accessibilityRole="button"
          >
            <Text style={styles.flowActionText}>Back to Trusted Contacts</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (appointment && counselor && flow === 'reschedule') {
    const newDate = new Date(`${appointment.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return (
      <Screen padded={false}>
        <View style={styles.flowConfirmation}>
          <View style={styles.flowBadge}><Ionicons name="checkmark" size={22} color={colors.white} /></View>
          <Text style={styles.flowTitle}>Reschedule Request Sent</Text>
          <Text style={styles.flowBody}>
            Your reschedule request for {newDate} at {formatTime(appointment.time)} has been sent to {counselor.name}. The new time is pending counselor approval.
          </Text>
          <View style={styles.savedPill}>
            <View style={styles.savedDot} />
            <Text style={styles.savedText}>Request saved to Firebase</Text>
          </View>
          <Pressable onPress={() => router.replace('/sessions?tab=upcoming')} style={styles.flowAction} accessibilityRole="button">
            <Text style={styles.flowActionText}>Back to My Sessions</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (appointment && counselor && flow === 'cancel') {
    return (
      <Screen padded={false}>
        <View style={styles.flowConfirmation}>
          <View style={styles.cancelCard}>
            <View style={styles.phoneBadge}><Ionicons name="phone-portrait-outline" size={20} color={colors.tealDark} /></View>
            <Text style={styles.flowTitle}>Appointment Cancelled</Text>
            <Text style={styles.flowBody}>
              Your session with {counselor.name} has been cancelled. Your cancellation details remain private.
            </Text>
            <View style={styles.cancelFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="shield-checkmark-outline" size={10} color={colors.tealDark} />
                <Text style={styles.footerText}>Private record</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="checkmark-circle-outline" size={10} color={colors.tealDark} />
                <Text style={styles.footerText}>Reschedule anytime</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={() => router.replace('/sessions?tab=upcoming')} style={styles.flowAction} accessibilityRole="button">
            <Text style={styles.flowActionText}>Back to My Sessions</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (appointment && counselor) {
    const appointmentDate = new Date(`${appointment.date}T12:00:00`);
    const dateLabel = appointmentDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const sessionLabel = appointment.type === 'video'
      ? 'Secure Video Session'
      : appointment.type === 'chat'
        ? 'Private Chat Session'
        : 'In-Person Session';

    return (
      <Screen padded={false}>
        <View style={styles.confirmation}>
          <View style={styles.confirmBadge}>
            <Ionicons name="checkmark" size={22} color="#58B87F" />
          </View>
          <Text style={styles.confirmTitle}>Appointment Confirmed</Text>
          <Text style={styles.confirmBody}>Your session is confirmed. The details are below.</Text>
          <Card style={styles.appointmentCard}>
            <View style={styles.counselorRow}>
              <Avatar name={counselor.name} color={counselor.avatarColor} size={34} />
              <View style={styles.counselorInfo}>
                <Text style={styles.counselorName}>{counselor.name}</Text>
                <Text style={styles.counselorTitle}>{counselor.title}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <DetailRow icon="calendar-outline" text={dateLabel} />
            <DetailRow icon="time-outline" text={`${formatTime(appointment.time)} · ${appointment.durationMin} mins`} />
            <DetailRow
              icon={appointment.type === 'video' ? 'videocam-outline' : appointment.type === 'chat' ? 'chatbubble-ellipses-outline' : 'location-outline'}
              text={sessionLabel}
            />
          </Card>
          <Pressable
              onPress={() => router.replace('/(tabs)/support')}
              style={({ pressed }) => [styles.counselorsButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.counselorsButtonText}>Back to counselor list</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (flow === 'profile') {
    return (
      <Screen padded={false}>
        <View style={styles.profileConfirmation}>
          <Card style={styles.profileUpdatedCard}>
            <View style={styles.profileCheckOuter}>
              <View style={styles.profileCheckInner}>
                <Ionicons name="checkmark" size={30} color={colors.white} />
              </View>
            </View>
            <Text style={styles.profileUpdatedTitle}>Profile Updated</Text>
            <Text style={styles.profileUpdatedBody}>
              Your personal details and privacy preferences have been saved to your Firebase account.
            </Text>
            <View style={styles.profileSavedPill}>
              <Ionicons name="time-outline" size={12} color={colors.tealDark} />
              <Text style={styles.profileSavedText}>Effective now · Saved to Firebase</Text>
            </View>
          </Card>
          <Pressable
            onPress={() => router.replace((href as Href) || '/(tabs)/profile')}
            style={styles.profileContinue}
            accessibilityRole="button"
          >
            <Text style={styles.profileContinueText}>Back to profile</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.genericConfirmation}>
        <Card style={styles.genericCard}>
          <View style={styles.genericBadgeOuter}>
            <View style={styles.genericBadgeInner}>
              <Ionicons name="checkmark" size={30} color={colors.white} />
            </View>
          </View>
          <Text style={styles.title}>{title ?? 'Saved'}</Text>
          <Text style={styles.body}>{body ?? 'Your changes have been saved to your Firebase account.'}</Text>
          <Pressable
            onPress={() => router.replace((href as Href) || '/(tabs)')}
            style={({ pressed }) => [styles.genericContinue, pressed && styles.genericButtonPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.genericContinueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.white} />
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={colors.tealDark} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  genericConfirmation: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  genericCard: { width: '100%', maxWidth: 440, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, borderRadius: 22, backgroundColor: '#FFFFFF', shadowColor: '#183C34', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  genericBadgeOuter: { width: 86, height: 86, alignItems: 'center', justifyContent: 'center', borderRadius: 43, backgroundColor: '#DDF2EC', marginBottom: 14 },
  genericBadgeInner: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#4BB6A5' },
  genericContinue: { width: '100%', minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, borderRadius: 25, backgroundColor: '#1C9B84' },
  genericContinueText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  genericButtonPressed: { opacity: 0.82 },
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 48 },
  confirmation: { flex: 1, alignItems: 'center', paddingHorizontal: 14, paddingTop: 48 },
  flowConfirmation: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 40 },
  profileConfirmation: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 28 },
  profileUpdatedCard: { width: '100%', maxWidth: 440, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 28, borderRadius: 20 },
  profileCheckOuter: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center', borderRadius: 46, backgroundColor: '#EFF9F6', marginBottom: 12 },
  profileCheckInner: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#4BB6A5' },
  profileUpdatedTitle: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  profileUpdatedBody: { maxWidth: 300, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  profileSavedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, backgroundColor: '#EEF5F2' },
  profileSavedText: { color: '#617C72', fontSize: 13 },
  profileContinue: { minHeight: 44, minWidth: 180, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 18, borderRadius: 22, backgroundColor: '#5BA48F' },
  profileContinueText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  feedbackConfirmation: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  feedbackSuccessCard: { width: '100%', maxWidth: 440, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 26, borderWidth: 1, borderColor: '#E7ECE9', borderRadius: 22, backgroundColor: '#FFFFFF', shadowColor: '#183C34', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  feedbackBadgeOuter: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 42, backgroundColor: '#DDF2EC', marginBottom: 12 },
  feedbackBadgeInner: { width: 55, height: 55, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#4BB6A5' },
  feedbackTitle: { color: colors.tealDark, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  feedbackBody: { color: '#53615D', fontSize: 15, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  feedbackDetails: { width: '100%', padding: 12, borderRadius: 14, backgroundColor: '#F2F5FF' },
  feedbackDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 10 },
  feedbackDetailCopy: { flex: 1, gap: 3 },
  feedbackDetailTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  feedbackDetailSub: { color: colors.muted, fontSize: 13 },
  feedbackPrivacyRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#E2E7F2' },
  feedbackPrivacyLabel: { flex: 1, color: colors.tealDark, fontSize: 13, fontWeight: '600' },
  feedbackPrivacyValue: { color: '#5E6C67', fontSize: 12 },
  feedbackReminder: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 11, borderWidth: 1, borderColor: '#E9E0FB', borderRadius: 12, backgroundColor: '#F7F2FF' },
  feedbackReminderText: { flex: 1, color: '#61548A', fontSize: 13, lineHeight: 16 },
  feedbackContinue: { minHeight: 42, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: 14, borderRadius: 22, backgroundColor: '#5BA48F' },
  feedbackContinueText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  flowBadge: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#3FAF9A', marginBottom: 12, shadowColor: '#3FAF9A', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  flowTitle: { color: '#293F39', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  flowBody: { maxWidth: 270, color: colors.muted, fontSize: 12, lineHeight: 14, textAlign: 'center', marginTop: 7 },
  savedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#EEF5F2' },
  savedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#58B87F' },
  savedText: { color: '#617C72', fontSize: 11 },
  cancelCard: { width: '100%', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, shadowColor: '#183C34', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  trustedContactRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, padding: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: '#F8F8F5' },
  initialsBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#55B6A7' },
  initialsText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  phoneBadge: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#E5F4EF', marginBottom: 9 },
  cancelFooter: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', gap: 8, marginTop: 14, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.line },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: colors.tealDark, fontSize: 11 },
  flowAction: { minHeight: 36, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 13, borderRadius: 20, backgroundColor: '#5BA48F' },
  flowActionText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  confirmBadge: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, borderColor: '#67C486', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  confirmTitle: { color: '#293F39', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  confirmBody: { color: colors.muted, fontSize: 12, lineHeight: 13, textAlign: 'center', marginTop: 6, marginBottom: 14, maxWidth: 250 },
  appointmentCard: { width: '100%', padding: 10, borderRadius: 10 },
  counselorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counselorInfo: { flex: 1, minWidth: 0, gap: 2 },
  counselorName: { color: colors.tealDark, fontSize: 12, fontWeight: '700' },
  counselorTitle: { color: colors.muted, fontSize: 11 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  detailText: { flex: 1, color: '#415750', fontSize: 11, lineHeight: 12 },
  counselorsButton: { minHeight: 40, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 22, backgroundColor: '#5BA48F' },
  counselorsButtonText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  buttonPressed: { opacity: 0.8 },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
});
