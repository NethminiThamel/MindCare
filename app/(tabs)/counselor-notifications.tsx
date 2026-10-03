import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { CounselorNotification } from '../types';

export default function CounselorNotifications() {
  const { currentUser, state, markNotificationRead } = useApp();
  const counselorId = currentUser?.id ?? '';

  const notifications = state.notifications?.filter((n: CounselorNotification) => n.counselorId === counselorId) ?? [];

  return (
    <Screen>
      <Header title="Counselor Alerts & Notifications" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sub}>
          Real-time updates regarding student appointment requests, messages, and system alerts.
        </Text>

        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.teal} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>You are all caught up on alerts.</Text>
          </Card>
        ) : (
          notifications.map((n: CounselorNotification) => (
            <Pressable key={n.id} onPress={() => markNotificationRead(n.id)}>
              <Card style={[styles.card, !n.read && styles.unreadCard]}>
                <View style={styles.topRow}>
                  <View style={styles.typeRow}>
                    <Ionicons
                      name={
                        n.type === 'request'
                          ? 'calendar-outline'
                          : n.type === 'chat'
                          ? 'chatbubble-ellipses-outline'
                          : n.type === 'crisis'
                          ? 'alert-circle-outline'
                          : 'information-circle-outline'
                      }
                      size={18}
                      color={n.type === 'crisis' ? colors.coral : colors.tealDark}
                    />
                    <Text style={styles.title}>{n.title}</Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.muted, fontSize: 15, marginTop: 4, marginBottom: 16 },
  emptyCard: { padding: 24, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' },
  card: { marginBottom: 10, padding: 14 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.tealDark, backgroundColor: '#F4FAF8' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  message: { fontSize: 15, color: colors.muted, marginVertical: 4 },
  time: { fontSize: 13, color: colors.muted },
});
