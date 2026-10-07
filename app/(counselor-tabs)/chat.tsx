import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { studentDisplayName } from '../../lib/student-privacy';

export default function CounselorChatList() {
  const { currentUser, state } = useApp();
  const counselorId = currentUser?.id ?? '';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent'>('all');

  // Group messages by student
  const studentIds = Array.from(
    new Set(state.messages.filter((m) => m.counselorId === counselorId).map((m) => m.userId))
  );
  const activeStudentIds = new Set(state.appointments
    .filter((appointment) => appointment.counselorId === counselorId && ['upcoming', 'pending'].includes(appointment.status))
    .map((appointment) => appointment.userId));
  const visibleStudentIds = studentIds.filter((userId) => {
    const student = state.users.find((user) => user.id === userId);
    const name = studentDisplayName(student).toLowerCase();
    const conversation = state.messages.filter((message) => message.counselorId === counselorId && message.userId === userId);
    const lastMessage = conversation[conversation.length - 1]?.text.toLowerCase() ?? '';
    const isUrgent = /urgent|crisis|unsafe|panic/.test(lastMessage);
    return name.includes(query.trim().toLowerCase()) &&
      (filter === 'all' || (filter === 'active' ? activeStudentIds.has(userId) : isUrgent));
  });

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.brandMark}
            accessibilityLabel="MindCare logo"
          />
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.sub}>Secure student conversations</Text>
          </View>
          <Pressable style={styles.requestBtn} onPress={() => router.push('/counselor-chat-requests')} accessibilityRole="button" accessibilityLabel="Chat requests">
            <Ionicons name="mail-unread-outline" size={16} color={colors.tealDark} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={14} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search student ID, keywords, or care notes..." placeholderTextColor={colors.muted} style={styles.searchInput} accessibilityLabel="Search conversations" />
          <Ionicons name="mic-outline" size={14} color={colors.muted} />
        </View>

        <View style={styles.filterRow}>
          <FilterChip label={`All Chats (${studentIds.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label={`Active Sessions (${activeStudentIds.size})`} active={filter === 'active'} onPress={() => setFilter('active')} />
          <FilterChip label="Urgent" active={filter === 'urgent'} urgent onPress={() => setFilter('urgent')} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {visibleStudentIds.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={28} color={colors.teal} />
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptySub}>Try another search or filter.</Text>
          </Card>
        ) : (
          visibleStudentIds.map((uId) => {
            const student = state.users.find((u) => u.id === uId);
            const msgs = state.messages.filter(
              (m) => m.counselorId === counselorId && m.userId === uId
            );
            const lastMsg = msgs[msgs.length - 1];
            const name = studentDisplayName(student);
            const isAnonymous = student?.isAnonymous;
            const isActive = activeStudentIds.has(uId);
            const isUrgent = /urgent|crisis|unsafe|panic/i.test(lastMsg?.text ?? '');

            return (
              <Pressable
                key={uId}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: counselorId, userId: uId } })}
              >
                <View style={styles.chatCard}>
                  <View style={[styles.avatar, { backgroundColor: isAnonymous ? '#EEF2F0' : student?.avatarColor ?? colors.teal }]}>
                    <Text style={[styles.avatarText, isAnonymous && styles.avatarTextAnon]}>{isAnonymous ? '#72' : name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</Text>
                  </View>

                  <View style={styles.chatContent}>
                    <View style={styles.chatTop}>
                      <Text style={styles.name}>{name}</Text>
                      {lastMsg && (
                        <Text style={styles.timeText}>
                          {new Date(lastMsg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.chatMeta}>{isAnonymous ? 'Confidential session' : student?.year ? `${student.year} · ${student.major ?? 'Student'}` : 'Student'}</Text>

                    {lastMsg && (
                      <Text style={styles.lastMsg} numberOfLines={1}>
                        {lastMsg.sender === 'counselor' ? 'You: ' : ''}
                        {lastMsg.text}
                      </Text>
                    )}
                    <View style={styles.chatFooter}>
                      <Text style={[styles.sessionTag, isActive && styles.sessionTagActive]}>{isActive ? 'Active session' : 'Conversation'}</Text>
                      {isUrgent ? <Text style={styles.urgentTag}>Urgent</Text> : null}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      </View>
    </Screen>
  );
}

function FilterChip({ label, active, urgent, onPress }: { label: string; active: boolean; urgent?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && (urgent ? styles.urgentChipActive : styles.filterChipActive)]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.filterText, active && (urgent ? styles.urgentTextActive : styles.filterTextActive)]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  brandMark: { width: 31, height: 28, borderRadius: 6 },
  headingCopy: { flex: 1, gap: 1 },
  title: { color: '#397E72', fontSize: 14, fontWeight: '700' },
  sub: { color: '#53645F', fontSize: 14, fontWeight: '500' },
  requestBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.white },
  searchBox: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 21, backgroundColor: colors.white },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, color: colors.text, fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 5, marginTop: 7, marginBottom: 9 },
  filterChip: { minHeight: 22, justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  filterChipActive: { borderColor: '#65B19F', backgroundColor: '#E5F3EE' },
  urgentChipActive: { borderColor: '#E4A28E', backgroundColor: '#FFF1EC' },
  filterText: { color: '#53645F', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: colors.tealDark, fontWeight: '600' },
  urgentTextActive: { color: '#B56854', fontWeight: '600' },
  list: { gap: 8, paddingBottom: 12 },
  emptyCard: { padding: 24, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 14, color: '#53645F', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  chatCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  avatarTextAnon: { color: colors.tealDark },
  chatContent: { flex: 1, minWidth: 0 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: '#397E72' },
  timeText: { fontSize: 12, color: '#53645F', fontWeight: '500' },
  chatMeta: { color: '#53645F', fontSize: 13, fontWeight: '500', marginTop: 3 },
  lastMsg: { fontSize: 14, color: '#4D6059', fontWeight: '500', marginTop: 4 },
  chatFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  sessionTag: { color: '#53645F', fontSize: 12, fontWeight: '500', paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: colors.line, borderRadius: 7 },
  sessionTagActive: { color: colors.tealDark, borderColor: '#B8DDD0', backgroundColor: '#EEF7F3' },
  urgentTag: { color: '#B56854', fontSize: 12, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: '#FFF0EA' },
});
