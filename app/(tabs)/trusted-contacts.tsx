import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Avatar, BackHeader, Card, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function TrustedContacts() {
  const { ready } = useApp();

  if (!ready) {
    return (
      <Screen>
        <BackHeader title="Safety Settings" />
        <Text style={styles.description}>Loading your safety settings...</Text>
      </Screen>
    );
  }

  return <TrustedContactsContent />;
}

function TrustedContactsContent() {
  const { currentUser, state, addContact, deleteContact, updateSettings } = useApp();
  const contacts = state.contacts.filter((contact) => contact.userId === currentUser?.id);
  const settings = state.settings.find((item) => item.userId === currentUser?.id);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shareEmergencyStatus, setShareEmergencyStatus] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const contactToDelete = contacts.find((contact) => contact.id === deleteContactId);
  const allowTrustedContactInCrisis = settings?.allowTrustedContactInCrisis ?? true;
  const shareLocationDuringCrisis = settings?.shareLocationDuringCrisis ?? false;

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      setFormError('Enter a contact name and phone number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address or leave it blank.');
      return;
    }
    setFormError('');
    const contact = addContact({
      name: name.trim(),
      relation: relation.trim() || 'Support person',
      phone: phone.trim(),
      email: email.trim() || undefined,
      shareEmergencyStatus,
    });
    router.replace({ pathname: '/done', params: { flow: 'trusted-contact', contactId: contact.id } });
  };

  return (
    <Screen scroll={false}>
      <View style={styles.page}>
        <BackHeader title="Safety Settings" />
        <Text style={styles.description}>Configure crisis protocols and trusted support.</Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TRUSTED CONTACTS</Text>
              <Pressable
                onPress={() => { setShowAddForm((shown) => !shown); setFormError(''); }}
                style={styles.addButton}
                accessibilityRole="button"
              >
                <Ionicons name={showAddForm ? 'close-outline' : 'add-outline'} size={16} color={colors.tealDark} />
                <Text style={styles.addText}>{showAddForm ? 'Close' : 'Add'}</Text>
              </Pressable>
            </View>

            {contacts.length ? contacts.map((contact) => (
              <Pressable
                key={contact.id}
                onPress={() => router.push(`/trusted-contact/${contact.id}`)}
                style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${contact.name}`}
              >
                <Avatar name={contact.name} color={colors.teal} size={38} />
                <View style={styles.contactCopy}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactMeta}>{contact.relation} · {contact.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            )) : (
              <Text style={styles.emptyContacts}>Add someone you trust to your crisis support plan.</Text>
            )}
          </Card>

          {showAddForm ? (
            <Card style={styles.card}>
              <Text style={styles.formTitle}>Add a trusted contact</Text>
              <ContactField label="CONTACT NAME" value={name} onChangeText={setName} placeholder="Contact name" />
              <ContactField label="RELATIONSHIP" value={relation} onChangeText={setRelation} placeholder="Parent, sibling, friend..." />
              <ContactField label="PHONE NUMBER" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
              <ContactField label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="Email address (optional)" keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.contactShareRow}>
                <Text style={styles.contactShareLabel}>Share emergency status with this contact</Text>
                <Switch
                  value={shareEmergencyStatus}
                  onValueChange={setShareEmergencyStatus}
                  trackColor={{ false: colors.line, true: '#5BA48F' }}
                  thumbColor={colors.white}
                />
              </View>
              {formError ? <Text style={styles.formError} accessibilityRole="alert">{formError}</Text> : null}
              <Pressable onPress={save} style={styles.saveButton} accessibilityRole="button">
                <Text style={styles.saveText}>Save Contact</Text>
              </Pressable>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>CRISIS CONSENT</Text>
            <Text style={styles.crisisDescription}>
              Choose whether MindCare may contact your trusted person or share your location if you request crisis support.
            </Text>
            <SafetyToggle
              label="Allow app to contact my trusted person if I’m in crisis"
              value={allowTrustedContactInCrisis}
              onValueChange={(value) => updateSettings({ allowTrustedContactInCrisis: value })}
            />
            <SafetyToggle
              label="Share my location during active crisis support"
              value={shareLocationDuringCrisis}
              onValueChange={(value) => updateSettings({ shareLocationDuringCrisis: value })}
              last
            />
            <Text style={styles.disclaimer}>
              These preferences are saved on this device. Location is not collected unless a crisis-support flow is available and you choose to use it.
            </Text>
          </Card>

          {contacts.length ? (
            <Pressable onPress={() => Linking.openURL(`tel:${contacts[0].phone.replace(/[^\d+]/g, '')}`)} style={styles.callButton} accessibilityRole="button">
              <Ionicons name="call-outline" size={17} color={colors.white} />
              <Text style={styles.saveText}>Call {contacts[0].name}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <Modal transparent visible={!!contactToDelete} animationType="fade" onRequestClose={() => setDeleteContactId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Delete trusted contact?</Text>
            <Text style={styles.confirmBody}>Remove {contactToDelete?.name} from your safety contacts?</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setDeleteContactId(null)} style={styles.keepButton} accessibilityRole="button">
                <Text style={styles.keepText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (contactToDelete) deleteContact(contactToDelete.id);
                  setDeleteContactId(null);
                }}
                style={styles.confirmDeleteButton}
                accessibilityRole="button"
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SafetyToggle({
  label,
  value,
  onValueChange,
  last = false,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.safetyRow, !last && styles.divider]}>
      <Text style={styles.safetyLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.line, true: '#5BA48F' }} thumbColor={colors.white} />
    </View>
  );
}

function ContactField({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 19, marginBottom: 14 },
  scrollContent: { paddingBottom: 24, gap: 12 },
  card: { padding: 15, borderRadius: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionLabel: { color: colors.tealDark, fontSize: 13, fontWeight: '700' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4 },
  addText: { color: colors.tealDark, fontSize: 14, fontWeight: '600' },
  contactRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, marginTop: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white },
  contactCopy: { flex: 1, gap: 4 },
  contactName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  contactMeta: { color: colors.muted, fontSize: 13 },
  emptyContacts: { color: colors.muted, fontSize: 14, lineHeight: 18, paddingVertical: 8 },
  formTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  fieldGroup: { gap: 5, marginTop: 8 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#F6F9F8', color: colors.text, fontSize: 15 },
  contactShareRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  contactShareLabel: { flex: 1, color: colors.text, fontSize: 14 },
  formError: { color: colors.coral, fontSize: 14, marginTop: 5 },
  saveButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 22, backgroundColor: '#5BA48F' },
  saveText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  crisisDescription: { color: colors.muted, fontSize: 14, lineHeight: 17, marginTop: 8, marginBottom: 8 },
  safetyRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  safetyLabel: { flex: 1, color: '#344A45', fontSize: 14, lineHeight: 17 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 15, marginTop: 8 },
  callButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 23, backgroundColor: '#5BA48F' },
  pressed: { opacity: 0.8 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(17, 39, 34, 0.35)' },
  confirmDialog: { padding: 18, borderRadius: 16, backgroundColor: colors.white },
  confirmTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  confirmBody: { color: colors.muted, fontSize: 15, lineHeight: 18, marginTop: 7 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  keepButton: { minWidth: 70, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  keepText: { color: colors.tealDark, fontSize: 15, fontWeight: '600' },
  confirmDeleteButton: { minWidth: 70, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.coral },
  confirmDeleteText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
