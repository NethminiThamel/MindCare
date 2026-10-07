import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar, Screen } from "../../../components/ui";
import { colors } from "../../../constants/theme";
import { useApp } from "../../../context/AppContext";

export default function EditTrustedContact() {
  const { id, returnTo } = useLocalSearchParams<{
    id: string;
    returnTo?: string;
  }>();
  const { currentUser, state, updateContact, deleteContact } = useApp();
  const contact = state.contacts.find(
    (item) => item.id === id && item.userId === currentUser?.id,
  );
  const [name, setName] = useState(contact?.name ?? "");
  const [relation, setRelation] = useState(contact?.relation ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [shareEmergencyStatus, setShareEmergencyStatus] = useState(
    contact?.shareEmergencyStatus ?? false,
  );
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [formError, setFormError] = useState("");

  if (!contact) {
    return (
      <Screen>
        <Text style={styles.notFound}>Trusted contact not found.</Text>
      </Screen>
    );
  }

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      setFormError("Enter a contact name and phone number.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Enter a valid email address or leave it blank.");
      return;
    }
    setFormError("");
    updateContact(contact.id, {
      name: name.trim(),
      relation: relation.trim() || "Support person",
      phone: phone.trim(),
      email: email.trim() || undefined,
      shareEmergencyStatus,
    });
    router.replace({
      pathname: "/done",
      params: { flow: "trusted-contact", contactId: contact.id },
    });
  };

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Avatar
            name={currentUser?.name ?? "Student"}
            color={currentUser?.avatarColor ?? colors.teal}
            size={30}
            profileType="student"
            profileImage={currentUser?.profileImage}
          />
        </View>
        <Text style={styles.title}>My Trusted Contact</Text>
        <Text style={styles.subtitle}>
          In case of a severe crisis, we can notify this person if you give us
          consent.
        </Text>

        <View style={styles.formCard}>
          <ContactField
            label="CONTACT NAME"
            value={name}
            onChangeText={setName}
            placeholder="Contact Name"
          />
          <ContactField
            label="RELATIONSHIP"
            value={relation}
            onChangeText={setRelation}
            placeholder="Relationship e.g., Parent..."
          />
          <ContactField
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
          <ContactField
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {formError ? (
            <Text style={styles.formError} accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}
          <Pressable
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.saveText}>Submit &amp; Save</Text>
          </Pressable>
        </View>

        <View style={styles.emergencyStatusCard}>
          <View style={styles.emergencyStatusTextWrap}>
            <Text style={styles.emergencyStatusTitle}>Share Emergency</Text>
            <Text style={styles.emergencyStatusTitle}>Status</Text>
          </View>
          <Switch
            value={shareEmergencyStatus}
            onValueChange={setShareEmergencyStatus}
            trackColor={{ false: "#DDE6E4", true: "#4E9B8E" }}
            thumbColor="#F7F9F8"
            ios_backgroundColor="#DDE6E4"
          />
        </View>
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
            <Text style={styles.confirmBody}>
              Remove {contact.name} from your safety contacts?
            </Text>
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
                  router.replace({
                    pathname: "/trusted-contacts",
                    params: {
                      returnTo:
                        returnTo === "/(tabs)/profile" ||
                        returnTo === "/(tabs)/sos"
                          ? returnTo
                          : "/(tabs)",
                    },
                  });
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
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#72847E"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "#F4F5F1",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingRight: 10,
  },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: {
    color: "#3F7E74",
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  subtitle: {
    color: "#71847E",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 300,
  },
  formCard: {
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 0,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    color: "#5E7C76",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E6EFEA",
    borderRadius: 12,
    backgroundColor: "#EEF1EF",
    color: colors.text,
    fontSize: 15,
  },
  formError: { color: colors.coral, fontSize: 11, marginTop: 4 },
  saveButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#5A9A8E",
    marginTop: 8,
  },
  saveText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  emergencyStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4F5F3",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAEFEA",
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginTop: 22,
    minHeight: 80,
  },
  emergencyStatusTextWrap: {
    maxWidth: 140,
  },
  emergencyStatusTitle: {
    color: "#3D6A63",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(17, 39, 34, 0.35)",
  },
  confirmDialog: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  confirmTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  confirmBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    marginTop: 6,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  keepButton: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
  },
  keepText: { color: colors.tealDark, fontSize: 12, fontWeight: "600" },
  confirmDeleteButton: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.coral,
  },
  confirmDeleteText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  notFound: { color: colors.text, fontSize: 14 },
});
