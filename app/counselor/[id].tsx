import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, BackHeader, Card, Pill, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function CounselorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const c = state.counselors.find((x) => x.id === id);
  if (!c) {
    return (
      <Screen>
        <BackHeader title="Counselor" />
        <Text>Counselor not found.</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackHeader title="Profile" />
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Avatar name={c.name} color={c.avatarColor} size={84} profileType="counselor" />
        <Text style={styles.name}>{c.name}</Text>
        <Text style={styles.muted}>{c.title}</Text>
        <Text style={styles.meta}>
          ★ {c.rating} · {c.years} years
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {c.specialties.map((s) => (
          <Pill key={s} text={s} />
        ))}
      </View>
      <Card>
        <Text style={styles.bio}>{c.bio}</Text>
      </Card>
      <View style={{ height: 16 }} />
      <PrimaryButton label="Book a time" onPress={() => router.push(`/book/${c.id}`)} />
      <PrimaryButton
        label="Message"
        color={colors.tealMid}
        onPress={() => router.push(`/chat/${c.id}`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  muted: { color: colors.muted },
  meta: { color: colors.tealDark, fontWeight: '700' },
  bio: { color: colors.text, lineHeight: 22 },
});
