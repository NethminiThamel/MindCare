import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';

// Prevent native splash screen from hanging
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5FAF8' },
          animation: 'slide_from_right',
        }}
      />
      <SyncNotice />
    </AppProvider>
  );
}

function SyncNotice() {
  const { syncError } = useApp();
  if (!syncError) return null;
  return (
    <View style={styles.syncNotice} accessibilityRole="alert">
      <Text style={styles.syncNoticeText}>Cloud sync failed: {syncError}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  syncNotice: {
    position: 'absolute',
    top: 38,
    left: 12,
    right: 12,
    zIndex: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#8A2630',
  },
  syncNoticeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
