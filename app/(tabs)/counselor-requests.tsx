import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getActiveCounselorId, getRequestUrgency, formatTimeRange } from '../lib/counselor';
import { isStudentAnonymous, studentDisplayName } from '../lib/student-privacy';
import type { Appointment } from '../types';

type FilterTab = 'all' | 'urgent' | 'routine';

export default function CounselorRequests() {
  const { currentUser, state, respondToAppointmentRequest, addNotification } = useApp();
  const counselorId = getActiveCounselorId(currentUser, state.counselors);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const pendingRequests = useMemo(() => {
    return state.appointments
      .filter((a) => a.counselorId === counselorId && a.status === 'pending')
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [state.appointments, counselorId]);

  const urgentCount = useMemo(() => {
    return pendingRequests.filter((a) => getRequestUrgency(a).level === 'urgent').length;
  }, [pendingRequests]);

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((item) => {
      const urgency = getRequestUrgency(item);
      if (activeTab === 'urgent') return urgency.level === 'urgent';
      if (activeTab === 'routine') return urgency.level !== 'urgent';
      return true;
    });
  }, [pendingRequests, activeTab]);

  const handleAccept = (appointment: Appointment) => {
    respondToAppointmentRequest(appointment.id, 'upcoming');
    const student = state.users.find((u) => u.id === appointment.userId);
    const name = studentDisplayName(student, appointment.isAnonymous);

    addNotification({
      counselorId,
      title: 'Appointment Confirmed',
      message: `Confirmed session with ${name} for ${appointment.date} at ${appointment.time}.`,
      type: 'request',
      appointmentId: appointment.id,
      studentId: appointment.userId,
    });

    Alert.alert(
      'Session Confirmed',
      `You accepted the session with ${name}. Would you like to view the appointment details?`,
      [
        { text: 'Stay Here', style: 'cancel' },
        {
          text: 'View Session',
          onPress: () => router.push(`/counselor-appointment/${appointment.id}`),
        },
      ]
    );
  };

  const handleDecline = (appointment: Appointment) => {
    const student = state.users.find((u) => u.id === appointment.userId);
    const name = studentDisplayName(student, appointment.isAnonymous);

    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline this session request from ${name}? The student will be notified and guided to alternative slots or crisis resources.`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            respondToAppointmentRequest(appointment.id, 'cancelled');
            addNotification({
              counselorId,
              title: 'Request Declined',
              message: `Declined booking request from ${name}.`,
              type: 'system',
              appointmentId: appointment.id,
            });
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Student Requests & Triage" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Review incoming student bookings, assess clinical priority, and confirm counseling slots.
        </Text>

        {/* Triage Overview Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>PENDING QUEUE</Text>
            <Text style={styles.statNumber}>{pendingRequests.length}</Text>
            <Text style={styles.statHint}>Awaiting review</Text>
          </Card>

          <Card style={[styles.statCard, urgentCount > 0 && styles.statCardUrgent]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, urgentCount > 0 && styles.statLabelUrgent]}>
                URGENT TRIAGE
              </Text>
              {urgentCount > 0 && (
                <Ionicons name="warning-outline" size={14} color={colors.coral} />
              )}
            </View>
            <Text style={[styles.statNumber, urgentCount > 0 && styles.statNumberUrgent]}>
              {urgentCount}
            </Text>
            <Text style={[styles.statHint, urgentCount > 0 && styles.statHintUrgent]}>
              {urgentCount > 0 ? 'Requires immediate action' : 'No crisis flags'}
            </Text>
          </Card>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({pendingRequests.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('urgent')}
            style={[styles.tab, activeTab === 'urgent' && styles.tabActiveUrgent]}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={activeTab === 'urgent' ? colors.coral : colors.muted}
            />
            <Text style={[styles.tabText, activeTab === 'urgent' && styles.tabTextActiveUrgent]}>
              Urgent ({urgentCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('routine')}
            style={[styles.tab, activeTab === 'routine' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'routine' && styles.tabTextActive]}>
              Routine ({pendingRequests.length - urgentCount})
            </Text>
          </Pressable>
        </View>

        {/* Request Cards */}
        {filteredRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.teal} />
            <Text style={styles.emptyTitle}>Triage Queue Clear</Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all'
                ? 'No pending appointment requests at this moment.'
                : activeTab === 'urgent'
                ? 'No urgent triage requests require review.'
                : 'No routine requests in this filter.'}
            </Text>
            <Pressable
              style={styles.viewConfirmedBtn}
              onPress={() => router.push('/(counselor-tabs)/sessions?tab=confirmed')}
            >
              <Text style={styles.viewConfirmedText}>View Confirmed Sessions</Text>
            </Pressable>
          </Card>
        ) : (
          filteredRequests.map((appt) => {
            const student = state.users.find((u) => u.id === appt.userId);
            const isAnon = isStudentAnonymous(student, appt.isAnonymous);
            const name = studentDisplayName(student, appt.isAnonymous);
            const urgency = getRequestUrgency(appt);

            return (
              <Card key={appt.id} style={styles.requestCard}>
                {/* Top Badge & Urgency */}
                <View style={styles.cardTop}>
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                    <Ionicons
                      name={
                        urgency.level === 'urgent'
                          ? 'warning'
                          : urgency.level === 'moderate'
                          ? 'time'
                          : 'calendar'
                      }
                      size={12}
                      color={urgency.color}
                    />
                    <Text style={[styles.urgencyText, { color: urgency.color }]}>
                      {urgency.label}
                    </Text>
                  </View>

                  <View style={styles.typeBadge}>
                    <Ionicons
                      name={
                        appt.type === 'video'
                          ? 'videocam-outline'
                          : appt.type === 'chat'
                          ? 'chatbubble-outline'
                          : 'people-outline'
                      }
                      size={13}
                      color={colors.tealDark}
                    />
                    <Text style={styles.typeBadgeText}>
                      {appt.type === 'video'
                        ? 'Video'
                        : appt.type === 'chat'
                        ? 'Chat'
                        : 'In-Person'}
                    </Text>
                  </View>
                </View>

                {/* Student Info */}
                <View style={styles.studentRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: isAnon ? '#E0ECE8' : student?.avatarColor ?? colors.teal },
                    ]}
                  >
                    <Text style={[styles.avatarText, isAnon && styles.avatarTextAnon]}>
                      {isAnon ? '🔒' : name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{name}</Text>
                    <Text style={styles.studentSub}>
                      {isAnon
                        ? 'Confidential Student · Protected Identity'
                        : student?.year
                        ? `${student.year} · ${student.major ?? 'Student'}`
                        : 'Enrolled Student'}
                    </Text>
                  </View>
                </View>

                {/* Date & Time */}
                <View style={styles.dateTimeBox}>
                  <View style={styles.dtItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.tealDark} />
                    <Text style={styles.dtText}>{appt.date}</Text>
                  </View>
                  <View style={styles.dtItem}>
                    <Ionicons name="time-outline" size={14} color={colors.tealDark} />
                    <Text style={styles.dtText}>{formatTimeRange(appt.time, appt.durationMin)}</Text>
                  </View>
                </View>

                {/* Student Request Notes */}
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>STUDENT INQUIRY / REASON:</Text>
                  <Text style={styles.notesContent}>
                    {appt.notes ? `"${appt.notes}"` : 'No booking notes provided.'}
                  </Text>
                </View>

                {/* Links to Profile and Chat */}
                <View style={styles.linkRow}>
                  <Pressable
                    style={styles.linkBtn}
                    onPress={() => router.push(`/counselor-student/${appt.userId}`)}
                  >
                    <Ionicons name="document-text-outline" size={14} color={colors.tealDark} />
                    <Text style={styles.linkBtnText}>Student Safety & Moods</Text>
                  </Pressable>

                  <Pressable
                    style={styles.linkBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/chat/[id]',
                        params: { id: counselorId, userId: appt.userId },
                      })
                    }
                  >
                    <Ionicons name="chatbubbles-outline" size={14} color={colors.tealDark} />
                    <Text style={styles.linkBtnText}>Message</Text>
                  </Pressable>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(appt)}
                    accessibilityRole="button"
                    accessibilityLabel="Accept session request"
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>

                  <Pressable
                    style={styles.rescheduleBtn}
                    onPress={() => router.push(`/counselor-reschedule/${appt.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel="Reschedule session"
                  >
                    <Ionicons name="calendar-outline" size={14} color={colors.text} />
                    <Text style={styles.rescheduleText}>Reschedule</Text>
                  </Pressable>

                  <Pressable
                    style={styles.declineBtn}
                    onPress={() => handleDecline(appt)}
                    accessibilityRole="button"
                    accessibilityLabel="Decline session request"
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 18, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14, backgroundColor: colors.white },
  statCardUrgent: { borderColor: '#FFCDD2', backgroundColor: '#FFF9F9' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  statLabelUrgent: { color: colors.coral },
  statNumber: { fontSize: 24, fontWeight: '800', color: colors.tealDark, marginVertical: 4 },
  statNumberUrgent: { color: colors.coral },
  statHint: { fontSize: 13, color: colors.muted },
  statHintUrgent: { color: colors.coral },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabActive: { backgroundColor: colors.tealDark, borderColor: colors.tealDark },
  tabActiveUrgent: { backgroundColor: '#FEE2E2', borderColor: colors.coral },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  tabTextActiveUrgent: { color: colors.coral, fontWeight: '700' },
  emptyCard: { padding: 32, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  viewConfirmedBtn: {
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewConfirmedText: { color: colors.tealDark, fontWeight: '700', fontSize: 15 },
  requestCard: { marginBottom: 14, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: { fontSize: 13, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 13, fontWeight: '700', color: colors.tealDark },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  avatarTextAnon: { fontSize: 16 },
  studentName: { fontSize: 16, fontWeight: '800', color: colors.text },
  studentSub: { fontSize: 14, color: colors.muted, marginTop: 1 },
  dateTimeBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#F8FAF9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dtItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dtText: { fontSize: 15, fontWeight: '600', color: colors.text },
  notesBox: {
    backgroundColor: '#FBFDFD',
    borderLeftWidth: 3,
    borderLeftColor: colors.tealMid,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesLabel: { fontSize: 12, fontWeight: '800', color: colors.tealDark, letterSpacing: 0.5, marginBottom: 3 },
  notesContent: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 18 },
  linkRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8F5',
  },
  linkBtnText: { fontSize: 14, fontWeight: '700', color: colors.tealDark },
  actionRow: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.teal,
    paddingVertical: 11,
    borderRadius: 8,
  },
  acceptText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  rescheduleBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    borderRadius: 8,
  },
  rescheduleText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  declineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    paddingVertical: 11,
    borderRadius: 8,
  },
  declineText: { color: colors.coral, fontSize: 14, fontWeight: '700' },
});
