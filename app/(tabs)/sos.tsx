import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function Sos() {
  const { currentUser, state } = useApp();
  const trustedContact = state.contacts.find((contact) => contact.userId === currentUser?.id);
  const breathingResource = state.crisisResources.find((resource) => resource.category === 'coping');

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/(tabs)')} style={styles.back} accessibilityRole="button">
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={currentUser?.name ?? 'Student'} color={currentUser?.avatarColor ?? colors.teal} size={30} />
          </Pressable>
        </View>

        <Text style={styles.title}>Safety Center</Text>
        <Text style={styles.subtitle}>Instant access to immediate, judgment-free support</Text>

        <Pressable onPress={() => Linking.openURL('tel:988')} style={styles.helpline} accessibilityRole="button">
          <View style={styles.callIcon}><Ionicons name="call" size={16} color={colors.white} /></View>
          <Text style={styles.helplineTitle}>Call Crisis Helpline</Text>
          <Text style={styles.helplineSub}>Dial 988 - Free, Confidential &amp; 24/7 Support</Text>
        </Pressable>

        <ActionRow
          icon="chatbubble-outline"
          title="Text a Counselor"
          detail="Text 988 for free, confidential crisis support."
          badge="24/7"
          onPress={() => Linking.openURL('sms:988')}
        />
        <ActionRow
          icon="heart-outline"
          title="Contact Trusted Person"
          detail={trustedContact
            ? `Call ${trustedContact.name} - ${trustedContact.relation}`
            : 'Add someone you trust to your contact list.'}
          onPress={() => trustedContact
            ? Linking.openURL(`tel:${trustedContact.phone}`)
            : router.push('/trusted-contacts')}
        />
        <ActionRow
          icon="options-outline"
          title="Breathing Exercise"
          detail="Calm acute panic with paced 4-7-8 respiration."
          onPress={() => router.push(breathingResource ? `/crisis/${breathingResource.id}` : '/resources')}
        />

        <Pressable onPress={() => router.push('/trusted-contacts')} style={styles.contactsButton} accessibilityRole="button">
          <Ionicons name="person-add-outline" size={14} color={colors.white} />
          <Text style={styles.contactsText}>Add Trusted contacts</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ActionRow({
  icon,
  title,
  detail,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.actionIcon}><Ionicons name={icon} size={15} color={colors.tealDark} /></View>
      <View style={styles.actionCopy}>
        <View style={styles.actionTitleRow}>
          <Text style={styles.actionTitle}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.actionDetail} numberOfLines={2}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#778A84" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: { color: '#168779', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { maxWidth: 255, alignSelf: 'center', color: '#667B75', fontSize: 12, lineHeight: 14, textAlign: 'center', marginTop: 4, marginBottom: 10 },
  helpline: { minHeight: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderRadius: 11, backgroundColor: '#FF797B' },
  callIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)' },
  helplineTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },
  helplineSub: { color: colors.white, fontSize: 11, marginTop: 3 },
  actionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.white },
  pressed: { opacity: 0.78 },
  actionIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#EEF2FF' },
  actionCopy: { flex: 1, minWidth: 0, gap: 2 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionTitle: { color: '#31423E', fontSize: 12, fontWeight: '600' },
  actionDetail: { color: '#788984', fontSize: 11, lineHeight: 14 },
  badge: { color: '#378D73', fontSize: 6, fontWeight: '700', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E5F5EC' },
  contactsButton: { minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 5, borderRadius: 22, backgroundColor: '#50B6A4' },
  contactsText: { color: colors.white, fontSize: 12, fontWeight: '600' },
});
