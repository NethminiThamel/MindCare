import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime } from '../../lib/format';
import type { Appointment, Counselor } from '../../types';

type SessionTab = 'upcoming' | 'past';

export default function Sessions() {
  const { currentUser, state } = useApp();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const tab: SessionTab = tabParam === 'past' ? 'past' : 'upcoming';
  const appointments = state.appointments.filter((appointment) => appointment.userId === currentUser?.id);
  const upcomingSessions = appointments
    .filter((appointment) => appointment.status === 'upcoming' || appointment.status === 'pending')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const pastSessions = appointments
    .filter((appointment) => appointment.status === 'completed' || appointment.status === 'cancelled')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const sessions = tab === 'upcoming' ? upcomingSessions : pastSessions;
  const nextSession = upcomingSessions[0];

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/(tabs)')} style={styles.back} accessibilityRole="button">
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={currentUser?.name ?? 'Student'} color={currentUser?.avatarColor ?? colors.teal} size={30} />
          </Pressable>
        </View>

        <Text style={styles.title}>My Sessions</Text>
        <Text style={styles.subtitle}>{tab === 'upcoming' ? 'Manage your upcoming care' : 'History & medical summaries'}</Text>

        <View style={styles.tabs}>
          <SessionTabButton label="Upcoming" count={upcomingSessions.length} selected={tab === 'upcoming'} onPress={() => router.setParams({ tab: 'upcoming' })} />
          <SessionTabButton label="Past" selected={tab === 'past'} onPress={() => router.setParams({ tab: 'past' })} />
        </View>

        {tab === 'upcoming' && nextSession ? (
          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <Ionicons name={nextSession.type === 'video' ? 'videocam-outline' : 'calendar-outline'} size={14} color={colors.tealDark} />
            </View>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Your next session</Text>
              <Text style={styles.noticeText}>{formatDate(nextSession.date)} at {formatTime(nextSession.time)}</Text>
            </View>
          </View>
        ) : null}

        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={tab === 'upcoming' ? 'calendar-outline' : 'time-outline'} size={22} color={colors.muted} />
            <Text style={styles.emptyTitle}>{tab === 'upcoming' ? 'Nothing upcoming' : 'No past sessions'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? 'Book a counselor when you have a free hour.' : 'Completed sessions and summaries will appear here.'}
            </Text>
            {tab === 'upcoming' ? (
              <Pressable onPress={() => router.push('/support')} style={styles.findButton} accessibilityRole="button">
                <Text style={styles.findButtonText}>Find support</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {sessions.map((appointment) => {
              const counselor = state.counselors.find((item) => item.id === appointment.counselorId);
              if (!counselor) return null;
              return (
                <SessionCard
                  key={appointment.id}
                  appointment={appointment}
                  counselor={counselor}
                  tab={tab}
                  hasFeedback={state.feedback.some((feedback) => feedback.appointmentId === appointment.id)}
                />
              );
            })}
          </View>
        )}

        {tab === 'past' && pastSessions.length > 0 ? (
          <Text style={styles.archiveNote}>Showing past 6 months of records</Text>
        ) : null}
      </View>
    </Screen>
  );
}

function SessionTabButton({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, selected && styles.tabSelected]} accessibilityRole="tab" accessibilityState={{ selected }}>
      <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
      {count !== undefined ? <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text> : null}
    </Pressable>
  );
}

function SessionCard({
  appointment,
  counselor,
  tab,
  hasFeedback,
}: {
  appointment: Appointment;
  counselor: Counselor;
  tab: SessionTab;
  hasFeedback: boolean;
}) {
  const isUpcoming = tab === 'upcoming';
  const status = appointment.status === 'upcoming'
    ? 'Confirmed'
    : appointment.status === 'pending'
      ? 'Pending'
      : appointment.status === 'completed'
        ? 'Completed'
        : 'Cancelled';
  const appointmentType = appointment.type === 'video'
    ? 'Video Call'
    : appointment.type === 'chat'
      ? 'Chat'
      : 'In-Person';

  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(`/session-details/${appointment.id}`)} style={styles.cardHeader} accessibilityRole="button">
        <Avatar name={counselor.name} color={counselor.avatarColor} size={34} />
        <View style={styles.counselorCopy}>
          <Text style={styles.counselorName} numberOfLines={1}>{counselor.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{counselor.specialties[0]}</Text>
        </View>
        <View style={[styles.status, !isUpcoming && styles.statusPast]}>
          <Text style={[styles.statusText, !isUpcoming && styles.statusPastText]}>{status}</Text>
        </View>
      </Pressable>

      <View style={styles.divider} />
      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={12} color={colors.tealDark} />
          <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="time-outline" size={12} color={colors.tealDark} />
          <Text style={styles.detailText}>{formatTime(appointment.time)}</Text>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{appointmentType}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isUpcoming && appointment.status === 'pending' ? (
          <>
            <Pressable
              onPress={() => router.push({ pathname: '/appoinment/[id]', params: { id: appointment.id } })}
              style={styles.primaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionText}>View Request</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/chat/${counselor.id}`)} style={styles.secondaryAction} accessibilityRole="button">
              <Text style={styles.secondaryActionText}>Message</Text>
            </Pressable>
          </>
        ) : isUpcoming ? (
          <>
            <Pressable
              onPress={() => appointment.type === 'video'
                ? router.push(`/session/${appointment.id}`)
                : appointment.type === 'chat'
                  ? router.push(`/chat/${counselor.id}`)
                  : router.push({ pathname: '/appoinment/[id]', params: { id: appointment.id } })}
              style={styles.primaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionText}>
                {appointment.type === 'video' ? 'Join Video Call' : appointment.type === 'chat' ? 'Open Chat' : 'Get Directions'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/(tabs)/reschedule-session/${appointment.id}`)} style={styles.secondaryAction} accessibilityRole="button">
              <Text style={styles.secondaryActionText}>Reschedule</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => router.push(`/counselor-details/${counselor.id}`)} style={styles.primaryAction} accessibilityRole="button">
              <Text style={styles.primaryActionText}>Book Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(appointment.status === 'completed' && !hasFeedback
                ? `/(tabs)/feedback/${appointment.id}`
                : appointment.status === 'completed'
                  ? `/summary/${appointment.id}`
                  : { pathname: '/appoinment/[id]', params: { id: appointment.id } })}
              style={styles.secondaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionText}>
                {appointment.status === 'completed' ? hasFeedback ? 'Summary' : 'Leave Feedback' : 'Details'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 11, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: { color: '#397E72', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#738680', fontSize: 12, marginTop: 4, marginBottom: 11 },
  tabs: { flexDirection: 'row', height: 31, marginHorizontal: -1, marginBottom: 11, backgroundColor: colors.white },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabSelected: { borderBottomWidth: 2, borderBottomColor: '#56A998' },
  tabText: { color: '#748780', fontSize: 12 },
  tabTextSelected: { color: colors.tealDark, fontWeight: '600' },
  count: { minWidth: 13, height: 13, borderRadius: 7, textAlign: 'center', textAlignVertical: 'center', color: colors.muted, backgroundColor: '#E9F3F0', fontSize: 11 },
  countSelected: { color: colors.tealDark },
  notice: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.white },
  noticeIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#E6F3EF' },
  noticeCopy: { flex: 1, gap: 2 },
  noticeTitle: { color: '#374E47', fontSize: 12, fontWeight: '600' },
  noticeText: { color: colors.muted, fontSize: 11 },
  list: { gap: 9 },
  card: { padding: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.white, shadowColor: '#183C34', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 8 },
  counselorCopy: { flex: 1, minWidth: 0, gap: 3 },
  counselorName: { color: '#344A45', fontSize: 12, fontWeight: '600' },
  specialty: { color: '#788B85', fontSize: 11 },
  status: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#9ACDBD', borderRadius: 6, backgroundColor: '#E8F5EF' },
  statusPast: { borderColor: colors.line, backgroundColor: '#F6F8F7' },
  statusText: { color: '#4B927D', fontSize: 11 },
  statusPastText: { color: '#61736D' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 7 },
  detailsRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#536760', fontSize: 11 },
  typeTag: { marginLeft: 'auto', paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: colors.line, borderRadius: 5 },
  typeText: { color: '#5D716A', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 7 },
  primaryAction: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: 8, backgroundColor: '#5BA48F' },
  primaryActionText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  secondaryAction: { flex: 1, minHeight: 29, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.white },
  secondaryActionText: { color: '#647770', fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 7 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  emptyText: { maxWidth: 240, color: colors.muted, fontSize: 12, lineHeight: 15, textAlign: 'center' },
  findButton: { marginTop: 5, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 18, backgroundColor: '#5BA48F' },
  findButtonText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  archiveNote: { marginTop: 20, color: colors.muted, fontSize: 11, textAlign: 'center' },
});