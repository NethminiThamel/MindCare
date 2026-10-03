import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CancelAppointment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/(tabs)/cancel-session/[id]', params: { id } }} />;
}
