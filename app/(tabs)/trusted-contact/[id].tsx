import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar, BackHeader, Card, Screen } from '../../../components/ui';
import { colors } from '../../../constants/theme';
import { useApp } from '../../../context/AppContext';
import { validateEmail, validatePhone, validateRequiredName } from '../../../utils/formValidation';

export default function EditTrustedContact() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { currentUser, ready, state, updateContact, deleteContact } = useApp();
  const contact = state.contacts.find(
    (item) => item.id === id && item.userId === currentUser?.id,
  );
  const destination = returnTo === '/(tabs)/profile' || returnTo === '/(tabs)/sos'
    ? returnTo
    : '/(tabs)';
  const returnToContacts = () => router.replace({
    pathname: '/trusted-contacts',
    params: { returnTo: destination },
  });

  if (!ready) {
    return (
      <Screen>
        <BackHeader title="Trusted Contact" onBack={returnToContacts} />
        <Text style={styles.message}>Loading your trusted contact...</Text>
      </Screen>
    );
  }

  if (!contact) {
    return (
      <Screen>
        <BackHeader title="Trusted Contact" onBack={returnToContacts} />
        <Text style={styles.message}>Trusted contact not found.</Text>
      </Screen>
    );
  }

  return (
    <TrustedContactEditor
      contact={contact}
      destination={destination}
      returnToContacts={returnToContacts}
      updateContact={updateContact}
      deleteContact={deleteContact}
    />
  );
}

function TrustedContactEditor({
  contact,
  destination,
  returnToContacts,
  updateContact,
  deleteContact,
}: {
  contact: { id: string; name: string; relation: string; phone: string; email?: string; shareEmergencyStatus?: boolean };
  destination: string;
  returnToContacts: () => void;
  updateContact: (id: string, patch: Partial<{
    id: string;
    userId: string;
    name: string;
    relation: string;
    phone: string;
    email?: string;
    shareEmergencyStatus?: boolean;
  }>) => void;
  deleteContact: (id: string) => void;
}) {
  const [name, setName] = useState(contact.name ?? '');
  const [relation, setRelation] = useState(contact.relation ?? '');
  const [phone, setPhone] = useState(contact.phone ? contact.phone.replace(/\D/g, '').slice(0, 10) : '');
  const [email, setEmail] = useState(contact.email ?? '');
  const [shareEmergencyStatus, setShareEmergencyStatus] = useState(contact.shareEmergencyStatus ?? false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const save = () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const next = {
      name: validateRequiredName(cleanName),
      phone: validatePhone(cleanPhone),
      email: validateEmail(cleanEmail, false),
    };
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }
    updateContact(contact.id, {
      name: cleanName,
      relation: relation.trim() || 'Support person',
      phone: cleanPhone,
      email: cleanEmail || undefined,
      shareEmergencyStatus,
    });
    router.replace({
      pathname: '/done',
      params: { flow: 'trusted-contact', contactId: contact.id, returnTo: destination },
    });
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.page}>
        <BackHeader title="Trusted Contact" onBack={returnToContacts} />
        <View style={styles.profile}>
          <Avatar name={contact.name} color={colors.teal} size={52} />
          <View style={styles.profileCopy}>
            <Text style={styles.title}>Edit trusted contact</Text>
            <Text style={styles.subtitle}>Keep your crisis support details up to date.</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <ContactField
              label="CONTACT NAME"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setErrors((current) => ({ ...current, name: validateRequiredName(value) }));
              }}
              error={errors.name}
              placeholder="Contact name"
              autoCapitalize="words"
            />
            <ContactField
              label="RELATIONSHIP"
              value={relation}
              onChangeText={setRelation}
              placeholder="Parent, sibling, friend..."
              autoCapitalize="words"
            />
            <ContactField
              label="PHONE NUMBER"
              value={phone}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, '').slice(0, 10);
                setPhone(digits);
                setErrors((current) => ({ ...current, phone: validatePhone(digits) }));
              }}
              error={errors.phone}
              placeholder="10-digit phone number"
              inputMode="numeric"
              maxLength={10}
              onKeyPress={(event) => {
                const { key } = event.nativeEvent;
                if (key.length === 1 && !/^\d$/.test(key)) event.preventDefault();
              }}
            />
            <ContactField
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: validateEmail(value, false) }));
              }}
              error={errors.email}
              placeholder="Email address (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.shareRow}>
              <Text style={styles.shareLabel}>Share emergency status with this contact</Text>
              <Switch
                value={shareEmergencyStatus}
                onValueChange={setShareEmergencyStatus}
                trackColor={{ false: colors.line, true: '#5BA48F' }}
                thumbColor={colors.white}
              />
            </View>
            <Pressable
              onPress={save}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </Pressable>
          </Card>

          <Pressable
            onPress={() => setConfirmDeleteVisible(true)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${contact.name}`}
          >
            <Ionicons name="trash-outline" size={17} color={colors.coral} />
            <Text style={styles.deleteText}>Delete trusted contact</Text>
          </Pressable>
        </ScrollView>
      </View>

      <Modal
        transparent
        visible={confirmDeleteVisible}
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Delete trusted contact?</Text>
            <Text style={styles.confirmBody}>Remove {contact.name} from your safety contacts?</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setConfirmDeleteVisible(false)}
                style={styles.keepButton}
                accessibilityRole="button"
              >
                <Text style={styles.keepText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  deleteContact(contact.id);
                  setConfirmDeleteVisible(false);
                  returnToContacts();
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

function ContactField({
  label,
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityHint={error}
      />
      {error ? <Text style={styles.formError} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  profileCopy: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 17 },
  scrollContent: { gap: 12, paddingBottom: 28 },
  card: { gap: 8, padding: 15, borderRadius: 18 },
  fieldGroup: { gap: 5, marginTop: 6 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: '#F6F9F8',
    color: colors.text,
    fontSize: 15,
  },
  inputError: { borderColor: colors.coral },
  shareRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 4,
  },
  shareLabel: { flex: 1, color: colors.text, fontSize: 14 },
  formError: { color: colors.coral, fontSize: 14, marginTop: 2 },
  saveButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 23,
    backgroundColor: '#5BA48F',
  },
  saveText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  deleteButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1D6D1',
    borderRadius: 23,
    backgroundColor: colors.white,
  },
  deleteText: { color: colors.coral, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  message: { color: colors.muted, fontSize: 14, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(17, 39, 34, 0.35)',
  },
  confirmDialog: { padding: 18, borderRadius: 16, backgroundColor: colors.white },
  confirmTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  confirmBody: { color: colors.muted, fontSize: 15, lineHeight: 19, marginTop: 7 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  keepButton: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
  },
  keepText: { color: colors.tealDark, fontSize: 15, fontWeight: '600' },
  confirmDeleteButton: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.coral,
  },
  confirmDeleteText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
