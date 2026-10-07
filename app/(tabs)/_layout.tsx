import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { TabList, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

type BottomTabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
};

export default function TabLayout() {
  const { currentUser, ready } = useApp();
  const insets = useSafeAreaInsets();
  if (ready && !currentUser) return <Redirect href="/login" />;
  if (ready && currentUser?.role === 'admin') return <Redirect href="/admin" />;
  if (ready && currentUser?.role === 'counselor') return <Redirect href="/(counselor-tabs)" />;
  if (ready && currentUser && !currentUser.onboardingComplete) return <Redirect href="/onboarding" />;
  if (ready && currentUser && !currentUser.consentAccepted) return <Redirect href="/consent" />;

  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList style={[styles.bar, { height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) }]}>
        <TabTrigger name="home" href="/(tabs)" asChild>
          <BottomTabButton label="Home" icon="home-outline" />
        </TabTrigger>
        <TabTrigger name="sos" href="/sos" asChild>
          <BottomTabButton label="SOS" icon="shield-checkmark-outline" />
        </TabTrigger>
        <TabTrigger name="checkin" href="/support" asChild>
          <BottomTabButton label="Check-in" icon="add" isCenter />
        </TabTrigger>
        <TabTrigger name="inbox" href="/inbox" asChild>
          <BottomTabButton label="Inbox" icon="mail-outline" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <BottomTabButton label="Profile" icon="person-outline" />
        </TabTrigger>
        <TabTrigger name="mood-checkin" href="/checkin" style={styles.hiddenRoute} />
        <TabTrigger name="booking" href="/booking/c1" style={styles.hiddenRoute} />
        <TabTrigger name="counselor-details" href="/counselor-details/c1" style={styles.hiddenRoute} />
        <TabTrigger name="sessions" href="/sessions" style={styles.hiddenRoute} />
        <TabTrigger name="session-details" href="/session-details/a1" style={styles.hiddenRoute} />
        <TabTrigger name="trusted-contacts" href="/trusted-contacts" style={styles.hiddenRoute} />
        <TabTrigger name="trusted-contact-edit" href="/trusted-contact/ec1" style={styles.hiddenRoute} />
        <TabTrigger name="reschedule-session" href="/reschedule-session/a1" style={styles.hiddenRoute} />
        <TabTrigger name="cancel-session" href="/cancel-session/a1" style={styles.hiddenRoute} />
        <TabTrigger name="mood-calendar" href="/moods" style={styles.hiddenRoute} />
        <TabTrigger name="trend-analysis" href="/trends" style={styles.hiddenRoute} />
        <TabTrigger name="help" href="/help" style={styles.hiddenRoute} />
        <TabTrigger name="feedback" href="/feedback" style={styles.hiddenRoute} />
        <TabTrigger name="feedback/[id]" href="/feedback/a1" style={styles.hiddenRoute} />
      </TabList>
    </Tabs>
  );
}

function BottomTabButton({
  label,
  icon,
  isCenter = false,
  isFocused,
  style,
  ...pressableProps
}: BottomTabButtonProps) {
  const iconName = label === 'Home' && isFocused ? 'home' : icon;
  const color = isFocused ? colors.white : '#35413F';

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={[
        style as StyleProp<ViewStyle>,
        styles.tabButton,
        isCenter && styles.centerButton,
        isFocused && !isCenter && [
          styles.tabButtonActive,
          label === 'SOS' && styles.sosButtonActive,
        ],
      ]}
    >
      {isCenter ? (
        <>
          <View style={[styles.centerIcon, isFocused && styles.centerIconActive]}>
            <Ionicons name="add" size={27} color={isFocused ? colors.white : colors.tealDark} />
          </View>
          <Text style={[styles.centerLabel, isFocused && styles.centerLabelActive]}>Check-in</Text>
        </>
      ) : (
        <>
          <Ionicons name={iconName} size={isFocused ? 15 : 18} color={color} />
          <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  hiddenRoute: { display: 'none' },
  bar: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 4,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tabButton: { flex: 1, minWidth: 0, height: 48, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 24, backgroundColor: 'transparent' },
  tabButtonActive: {
    height: 40,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    marginHorizontal: 2,
    backgroundColor: colors.teal,
  },
  sosButtonActive: { backgroundColor: colors.coral },
  tabLabel: { color: '#35413F', fontSize: 12, lineHeight: 15 },
  tabLabelActive: { color: colors.white, fontWeight: '700' },
  centerButton: { gap: 1 },
  centerIcon: {
    width: 42,
    height: 42,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F3EF',
  },
  centerIconActive: { backgroundColor: colors.teal },
  centerLabel: { color: '#465752', fontSize: 11, fontWeight: '600', lineHeight: 14 },
  centerLabelActive: { color: colors.tealDark, fontWeight: '700' },
});
