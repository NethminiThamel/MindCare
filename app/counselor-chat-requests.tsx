import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getActiveCounselorId } from '../lib/counselor';
import { isStudentAnonymous, studentDisplayName } from '../lib/student-privacy';

export default function CounselorChatRequests() {
  const { currentUser, state, sendMessage, addNotification } = useApp();
  const counselorId = getActiveCounselorId(currentUser, state.counselors);

  // Derive chat inquiries from students who have active messages or appointment requests
  const students = useMemo(() => {
    return state.users.filter((student) => {
      if (student.role !== 'student') return false;
      if (!student.hideFromDirectory) return true;
      return state.messages.some((message) => message.userId === student.id && message.counselorId === counselorId) ||
        state.appointments.some((appointment) => appointment.userId === student.id && appointment.counselorId === counselorId);
    });
  }, [state.users, state.messages, state.appointments, counselorId]);

  // Students who have requested chat sessions or have recent messages
  const chatInquiries = useMemo(() => {
    return students.map((student) => {
      const msgs = state.messages.filter(
        (m) => m.counselorId === counselorId && m.userId === student.id
      );
      const lastMsg = msgs[msgs.length - 1];
      const hasChatAppt = state.appointments.some(
        (a) => a.counselorId === counselorId && a.userId === student.id && a.type === 'chat'
      );
      const isUrgent = /urgent|crisis|panic|anxious|help|emergency/i.test(lastMsg?.text ?? student.bio ?? '');

      return {
        student,
        lastMessage: lastMsg?.text ?? (hasChatAppt ? 'Student requested direct chat counseling session.' : 'New student chat inquiry submitted via portal.'),
        timeAgo: lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent inquiry',
        hasHistory: msgs.length > 0,
        isUrgent,
      };
    });
  }, [students, state.messages, state.appointments, counselorId]);

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeInquiries = useMemo(() => {
    return chatInquiries.filter((item) => !dismissedIds.includes(item.student.id));
  }, [chatInquiries, dismissedIds]);

  const handleAccept = (studentId: string, name: string) => {
    // If no message from counselor yet, send a warm introductory clinical greeting
    const studentMessages = state.messages.filter(
      (m) => m.counselorId === counselorId && m.userId === studentId
    );
    const counselorSent = studentMessages.some((m) => m.sender === 'counselor');

    if (!counselorSent) {
      sendMessage(
        counselorId,
        'Hello, I am here and ready to support you. Please take your time and let me know what is on your mind today.',
        studentId
      );
    }

    addNotification({
      counselorId,
      title: 'Chat Session Opened',
      message: `Started active messaging with ${name}.`,
      type: 'chat',
      studentId,
    });

    router.push({
      pathname: '/chat/[id]',
      params: { id: counselorId, userId: studentId },
    });
  };

  const handleDecline = (studentId: string, name: string) => {
    Alert.alert(
      'Decline Chat Request',
      `Decline chat inquiry from ${name}? The student will be prompted to book a standard session or access 24/7 crisis resources.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setDismissedIds((prev) => [...prev, studentId]);
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Direct Chat Inquiries" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Students seeking confidential text support. Accept an inquiry to start an encrypted, HIPAA-compliant session.
        </Text>

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.tealDark} />
          <Text style={styles.infoText}>
            All chats are confidential. Messages are stored securely within MindCare&apos;s clinical portal.
          </Text>
        </View>

        {activeInquiries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.teal} />
            <Text style={styles.emptyTitle}>No Active Inquiries</Text>
            <Text style={styles.emptySub}>
              All student chat requests have been responded to.
            </Text>
            <Pressable
              style={styles.openChatBtn}
              onPress={() => router.push('/(counselor-tabs)/chat')}
            >
              <Text style={styles.openChatBtnText}>View Active Conversations</Text>
            </Pressable>
          </Card>
        ) : (
          activeInquiries.map(({ student, lastMessage, timeAgo, isUrgent }) => {
            const isAnon = isStudentAnonymous(student);
            const name = studentDisplayName(student);

            return (
              <Card key={student.id} style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.studentInfo}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: isAnon ? '#E0ECE8' : student.avatarColor ?? colors.teal },
                      ]}
                    >
                      <Text style={[styles.avatarText, isAnon && styles.avatarTextAnon]}>
                        {isAnon ? '🔒' : name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{name}</Text>
                        {isUrgent && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentBadgeText}>Priority</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.meta}>
                        {isAnon
                          ? 'Confidential Student'
                          : student.year
                          ? `${student.year} · ${student.major ?? 'Student'}`
                          : 'Student'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.time}>{timeAgo}</Text>
                </View>

                {/* Message preview snippet */}
                <View style={styles.topicBox}>
                  <Text style={styles.topicLabel}>INQUIRY NOTE / TOPIC:</Text>
                  <Text style={styles.topicText}>&quot;{lastMessage}&quot;</Text>
                </View>

                {/* Shortcuts & Actions */}
                <View style={styles.secondaryActions}>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => router.push(`/counselor-student/${student.id}`)}
                  >
                    <Ionicons name="person-outline" size={13} color={colors.tealDark} />
                    <Text style={styles.secondaryBtnText}>View Student Safety Profile</Text>
                  </Pressable>
                </View>

                <View style={styles.btnRow}>
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(student.id, name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept chat with ${name}`}
                  >
                    <Ionicons name="chatbubbles" size={16} color="#FFF" />
                    <Text style={styles.acceptText}>Accept & Open Chat</Text>
                  </Pressable>

                  <Pressable
                    style={styles.declineBtn}
                    onPress={() => handleDecline(student.id, name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decline chat inquiry from ${name}`}
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
  lead: { fontSize: 15, color: colors.muted, lineHeight: 18, marginBottom: 12 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EBF6F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 14, color: colors.tealDark, lineHeight: 16 },
  emptyCard: { padding: 32, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  openChatBtn: {
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openChatBtnText: { color: colors.tealDark, fontWeight: '700', fontSize: 15 },
  card: { marginBottom: 14, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  avatarTextAnon: { fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  urgentBadgeText: { color: colors.coral, fontSize: 12, fontWeight: '800' },
  meta: { fontSize: 14, color: colors.muted, marginTop: 1 },
  time: { fontSize: 13, color: colors.muted },
  topicBox: {
    backgroundColor: '#F8FAF9',
    borderLeftWidth: 3,
    borderLeftColor: colors.tealMid,
    padding: 10,
    borderRadius: 6,
    marginVertical: 10,
  },
  topicLabel: { fontSize: 12, fontWeight: '800', color: colors.tealDark, letterSpacing: 0.5, marginBottom: 3 },
  topicText: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 18 },
  secondaryActions: { marginBottom: 12 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8F5',
    alignSelf: 'flex-start',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: colors.tealDark },
  btnRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 2,
    backgroundColor: colors.tealDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  declineBtn: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  declineText: { color: colors.coral, fontWeight: '700', fontSize: 15 },
});
