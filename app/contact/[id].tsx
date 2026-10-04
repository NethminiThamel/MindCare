import { Redirect, useLocalSearchParams } from 'expo-router';

export default function EditContact() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/(tabs)/trusted-contact/[id]', params: { id } }} />;
}
