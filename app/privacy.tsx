import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { BackHeader, Card, Screen } from '../components/ui';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Privacy() {
  const { currentUser, state, updateProfile, deleteAccount } = useApp();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [exportError, setExportError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  if (!currentUser) return null;

  const exportUserData = async () => {
    setExportError('');
    const profile = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      isAnonymous: currentUser.isAnonymous,
      hideFromDirectory: currentUser.hideFromDirectory,
      year: currentUser.year,
      major: currentUser.major,
      phone: currentUser.phone,
      bio: currentUser.bio,
      title: currentUser.title,
      specialties: currentUser.specialties,
    };
    const appointments = state.appointments.filter((item) => item.userId === currentUser.id);
    const appointmentIds = new Set(appointments.map((item) => item.id));
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      moods: state.moods.filter((item) => item.userId === currentUser.id),
      appointments,
      messages: state.messages.filter((item) => item.userId === currentUser.id),
      trustedContacts: state.contacts.filter((item) => item.userId === currentUser.id),
      crisisPlan: state.crisisPlans.find((item) => item.userId === currentUser.id) ?? null,
      feedback: state.feedback.filter((item) => item.userId === currentUser.id || appointmentIds.has(item.appointmentId)),
      settings: state.settings.find((item) => item.userId === currentUser.id) ?? null,
    };
    try {
      await Share.share({
        title: 'MindCare data export',
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to export your data right now.');
    }
  };

  const updateProfileField = (patch: Parameters<typeof updateProfile>[0]) => {
    setProfileError('');
    void updateProfile(patch).catch((cause: unknown) => {
      setProfileError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    });
  };

  const deleteAccountAndNavigate = async () => {
    setDeleteError('');
    try {
      await deleteAccount();
      setDeleteDialogVisible(false);
      router.replace('/login');
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'Could not delete your account.');
    }
  };


  return (
    <Screen scroll={false}>
      <View style={styles.page}>
        <BackHeader title="Advanced Privacy" />
        <Text style={styles.description}>
          Manage how your profile appears to others and control your data exports.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Controls</Text>
          <PrivacyRow
            label="Anonymous Chat Mode"
            value={currentUser.isAnonymous ?? false}
            onValueChange={(isAnonymous) => updateProfileField({ isAnonymous })}
          />
          <PrivacyRow
            label="Hide Profile from Directory"
            value={currentUser.hideFromDirectory ?? false}
            onValueChange={(hideFromDirectory) => updateProfileField({ hideFromDirectory })}
            last
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Data Actions</Text>
          <ActionButton
            label={currentUser.isAnonymous ? 'Anonymous user' : 'Become anonymous user'}
            onPress={() => updateProfileField({ isAnonymous: true })}
          />
          <ActionButton label="Export" onPress={() => { void exportUserData(); }} />
          {exportError ? <Text style={styles.error} accessibilityRole="alert">{exportError}</Text> : null}
          {profileError ? <Text style={styles.error} accessibilityRole="alert">{profileError}</Text> : null}
          <ActionButton label="Delete" danger onPress={() => setDeleteDialogVisible(true)} />
        </Card>
      </View>

      <Modal
        transparent
        visible={deleteDialogVisible}
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Delete your account?</Text>
            <Text style={styles.confirmBody}>
              This removes your Firebase sign-in and profile. Associated appointments, messages, and other
              Firestore records may remain; contact your program administrator to request full data deletion.
              Counselor accounts must be deprovisioned by an administrator.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setDeleteDialogVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={deleteAccountAndNavigate} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete account</Text>
              </Pressable>
            </View>
            {deleteError ? <Text style={styles.error} accessibilityRole="alert">{deleteError}</Text> : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PrivacyRow({
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
    <View style={[styles.privacyRow, !last && styles.divider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#DDE6E3', true: '#5BA48F' }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function ActionButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, danger && styles.dangerButton, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {danger ? <Ionicons name="trash-outline" size={15} color="#D85C4A" /> : null}
      <Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 19, marginBottom: 14 },
  card: { padding: 14, borderRadius: 16, marginBottom: 14 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  privacyRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { color: '#344A45', fontSize: 15, flex: 1 },
  actionButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white },
  actionText: { color: '#344A45', fontSize: 15, fontWeight: '600' },
  dangerButton: { borderColor: '#EFC9C2' },
  dangerText: { color: '#D85C4A' },
  error: { color: colors.coral, fontSize: 14, lineHeight: 17, marginTop: 8 },
  pressed: { opacity: 0.78 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(17, 39, 34, 0.4)' },
  confirmDialog: { padding: 18, borderRadius: 16, backgroundColor: colors.white },
  confirmTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  confirmBody: { color: colors.muted, fontSize: 15, lineHeight: 19, marginTop: 8 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  cancelText: { color: colors.tealDark, fontSize: 15, fontWeight: '600' },
  deleteButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#D85C4A' },
  deleteText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
