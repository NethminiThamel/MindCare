import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { BackHeader, Card, Pill, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Resources() {
  const { state } = useApp();
  return (
    <Screen>
      <BackHeader title="Support resources" />
      <Text style={styles.lead}>Campus, crisis, and coping tools you can open anytime.</Text>
      {state.crisisResources.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/crisis/${r.id}`)}>
          <Card style={{ marginBottom: 8 }}>
            <Pill text={r.category} tone={r.category === 'immediate' ? 'coral' : 'teal'} />
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.muted}>{r.description}</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  title: { fontWeight: '800', color: colors.text, marginTop: 8 },
  muted: { color: colors.muted, marginTop: 4, lineHeight: 20 },
});
