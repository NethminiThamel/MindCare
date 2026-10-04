import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Avatar, Screen, ToggleRow } from "../../../components/ui";
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
        <Text style={styles.title}>Edit Trusted Contact</Text>
        <Text style={styles.subtitle}>
          Update their information or emergency-status consent.
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
            <Text style={styles.saveText}>Save Changes</Text>
          </Pressable>
        </View>
        <ToggleRow
          label="Share Emergency Status"
          hint="Allow MindCare to share your emergency status with this contact."
          value={shareEmergencyStatus}
          onValueChange={setShareEmergencyStatus}
        />
        <Pressable
          onPress={() => setConfirmDeleteVisible(true)}
          style={styles.deleteButton}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={14} color={colors.coral} />
          <Text style={styles.deleteText}>Delete Trusted Contact</Text>
        </Pressable>
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
  content: { paddingHorizontal: 12, paddingTop: 8 },
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
  title: { color: "#397E72", fontSize: 21, fontWeight: "700" },
  subtitle: {
    color: "#71847E",
    fontSize: 12,
    lineHeight: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  formCard: {
    gap: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  fieldGroup: { gap: 4 },
  fieldLabel: { color: "#788A84", fontSize: 11, fontWeight: "600" },
  input: {
    minHeight: 35,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "#E0EBE7",
    borderRadius: 10,
    backgroundColor: "#F6F9F8",
    color: colors.text,
    fontSize: 12,
  },
  formError: { color: colors.coral, fontSize: 11 },
  saveButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#5BA48F",
  },
  saveText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.8 },
  deleteButton: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EFC7BF",
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  deleteText: { color: colors.coral, fontSize: 12, fontWeight: "600" },
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
