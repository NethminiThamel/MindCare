import { useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text } from 'react-native';
import { BackHeader, Card, PrimaryButton, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function CrisisResource() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const resource = state.crisisResources.find((r) => r.id === id);

  if (!resource) {
    return (
      <Screen>
        <BackHeader title="Resource" />
        <Text>Not found.</Text>
      </Screen>
    );
  }

  const tel = resource.phone?.replace(/[^\d]/g, '');

  return (
    <Screen>
      <BackHeader title="Resource" />
      <Text style={styles.title}>{resource.title}</Text>
      <Card style={{ marginTop: 12 }}>
        <Text style={styles.body}>{resource.description}</Text>
        {resource.phone ? <Text style={[styles.body, { marginTop: 10 }]}>Contact: {resource.phone}</Text> : null}
      </Card>
      {tel ? (
        <PrimaryButton label="Call now" color={colors.coral} onPress={() => Linking.openURL(`tel:${tel}`)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { color: colors.text, lineHeight: 22 },
});
