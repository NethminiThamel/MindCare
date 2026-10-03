import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Reschedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/(tabs)/reschedule-session/[id]', params: { id } }} />;
}
