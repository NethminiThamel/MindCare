import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, Card, EmptyState, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { formatWhen } from '../../lib/format';

export default function Inbox() {
  const { currentUser, state } = useApp();
  const [query, setQuery] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const threads = useMemo(() => state.counselors.map((counselor) => {
    const messages = state.messages
      .filter((message) => message.counselorId === counselor.id && message.userId === currentUser?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const nextAppointment = state.appointments
      .filter((appointment) => appointment.counselorId === counselor.id &&
        appointment.userId === currentUser?.id && appointment.status === 'upcoming')
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
    return { counselor, last: messages[0], nextAppointment };
  }).filter(({ counselor, last, nextAppointment }) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || counselor.name.toLowerCase().includes(search) || last?.text.toLowerCase().includes(search);
    return matchesSearch && (!showOnlyActive || Boolean(last || nextAppointment));
  }).sort((a, b) => (b.last?.createdAt ?? '').localeCompare(a.last?.createdAt ?? '')), [
    currentUser?.id,
    query,
    showOnlyActive,
    state.appointments,
    state.counselors,
    state.messages,
  ]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.navigate('/(tabs)')} style={styles.backButton} accessibilityRole="button">
            <Ionicons name="chevron-back" size={19} color={colors.muted} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Inbox</Text>
          <Avatar name={currentUser?.name ?? 'Student'} color={currentUser?.avatarColor ?? colors.teal} size={30} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search counselor or care notes..."
              placeholderTextColor="#91A5A0"
              style={styles.searchInput}
              accessibilityLabel="Search inbox"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setShowOnlyActive((active) => !active)}
            style={[styles.filterButton, showOnlyActive && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={showOnlyActive ? 'Show all conversations' : 'Filter conversations'}
            accessibilityState={{ selected: showOnlyActive }}
          >
            <Ionicons name="filter-outline" size={18} color={showOnlyActive ? colors.white : colors.tealDark} />
          </Pressable>
        </View>

        {currentUser?.isAnonymous ? (
          <View style={styles.privacyBanner}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.tealDark} />
            <View style={styles.privacyCopy}>
              <Text style={styles.privacyTitle}>Anonymous mode active</Text>
              <Text style={styles.privacyHint}>Your student ID and personal details are hidden in counselor conversations.</Text>
            </View>
          </View>
        ) : null}

        <Card style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Counselor conversations</Text>
            <Text style={styles.listCount}>{threads.length}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.threadList} showsVerticalScrollIndicator={false}>
            {threads.length ? threads.map(({ counselor, last, nextAppointment }) => (
              <Pressable
                key={counselor.id}
                onPress={() => router.push(`/chat/${counselor.id}`)}
                style={({ pressed }) => [styles.threadCard, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.threadAvatar}>
                  <Avatar name={counselor.name} color={counselor.avatarColor} size={42} />
                  <View style={styles.availabilityDot} />
                </View>
                <View style={styles.threadCopy}>
                  <View style={styles.threadHeading}>
                    <Text style={styles.counselorName} numberOfLines={1}>{counselor.name}</Text>
                    {last ? <Text style={styles.time}>{formatWhen(last.createdAt)}</Text> : null}
                  </View>
                  <Text style={styles.counselorTitle} numberOfLines={1}>{counselor.title}</Text>
                  <Text style={styles.preview} numberOfLines={2}>
                    {last ? `${last.sender === 'student' ? 'You: ' : ''}${last.text}` : 'Send a message to start a conversation.'}
                  </Text>
                  {nextAppointment ? (
                    <View style={styles.appointmentPill}>
                      <Ionicons name="calendar-outline" size={12} color={colors.tealDark} />
                      <Text style={styles.appointmentText}>
                        Next session · {new Date(`${nextAppointment.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {nextAppointment.time}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.muted} />
              </Pressable>
            )) : (
              <EmptyState
                title={query ? 'No conversations found' : 'No counselors found'}
                body={query ? 'Try a different name or search term.' : 'Your counselor list will appear here.'}
              />
            )}
          </ScrollView>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 12 },
  topBar: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 76, flexDirection: 'row', alignItems: 'center', gap: 1 },
  backText: { color: colors.muted, fontSize: 14 },
  pageTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.white },
  searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 15 },
  filterButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.white },
  filterButtonActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  privacyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.white },
  privacyCopy: { flex: 1, gap: 3 },
  privacyTitle: { color: colors.tealDark, fontSize: 15, fontWeight: '700' },
  privacyHint: { color: colors.muted, fontSize: 13, lineHeight: 15 },
  listCard: { flex: 1, padding: 12, borderRadius: 19 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, paddingBottom: 10 },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  listCount: { color: colors.tealDark, fontSize: 13, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, backgroundColor: colors.mint },
  threadList: { gap: 9, paddingBottom: 8 },
  threadCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderWidth: 1, borderColor: '#EDF1F0', borderRadius: 15, backgroundColor: colors.white },
  threadAvatar: { position: 'relative' },
  availabilityDot: { position: 'absolute', right: -1, bottom: 0, width: 10, height: 10, borderWidth: 2, borderColor: colors.white, borderRadius: 5, backgroundColor: '#46B78B' },
  threadCopy: { flex: 1, minWidth: 0, gap: 3 },
  threadHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  counselorName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  counselorTitle: { color: colors.muted, fontSize: 13 },
  time: { color: '#8A9A96', fontSize: 12 },
  preview: { color: '#566B65', fontSize: 14, lineHeight: 16, marginTop: 1 },
  appointmentPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.mint },
  appointmentText: { color: colors.tealDark, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
