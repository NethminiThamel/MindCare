import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/(tabs)/booking/[id]', params: { id } }} />;
}
