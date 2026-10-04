import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader, Field, PrimaryButton, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function CrisisPlanScreen() {
  const { currentUser, state, saveCrisisPlan } = useApp();
  const existing = state.crisisPlans.find((p) => p.userId === currentUser?.id);
  const [warningSigns, setWarningSigns] = useState(existing?.warningSigns ?? '');
  const [copingStrategies, setCopingStrategies] = useState(existing?.copingStrategies ?? '');
  const [reasonsToLive, setReasonsToLive] = useState(existing?.reasonsToLive ?? '');

  return (
    <Screen>
      <BackHeader title="Crisis plan" />
      <Text style={styles.lead}>Write this while you are steady. Keep it short enough to read in a spike.</Text>
      <View style={{ gap: 12 }}>
        <Field
          label="Warning signs"
          value={warningSigns}
          onChangeText={setWarningSigns}
          placeholder="What tells you things are sliding?"
          multiline
        />
        <Field
          label="Coping strategies"
          value={copingStrategies}
          onChangeText={setCopingStrategies}
          placeholder="Walk, breathe, text someone, call campus line"
          multiline
        />
        <Field
          label="Reasons to stay"
          value={reasonsToLive}
          onChangeText={setReasonsToLive}
          placeholder="People, pets, plans that still matter"
          multiline
        />
      </View>
      <PrimaryButton
        label="Save plan"
        onPress={() => {
          saveCrisisPlan({
            warningSigns: warningSigns.trim(),
            copingStrategies: copingStrategies.trim(),
            reasonsToLive: reasonsToLive.trim(),
          });
          router.replace({
            pathname: '/done',
            params: {
              title: 'Plan saved',
              body: 'Your crisis plan is on this device and ready from SOS.',
              href: '/(tabs)/sos',
            },
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, marginBottom: 14, lineHeight: 20 },
});
