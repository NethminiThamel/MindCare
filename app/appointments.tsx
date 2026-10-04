import { Redirect } from 'expo-router';

export default function Appointments() {
  return <Redirect href="/(tabs)/sessions?tab=upcoming" />;
}
