import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Avatar, Card, Screen } from "../../components/ui";
import { colors } from "../../constants/theme";
import { useApp } from "../../context/AppContext";
import { studentDisplayName } from "../../lib/student-privacy";

const quickReplies = [
  "I'd like to book another session.",
  "Thank you!",
  "Can you suggest some coping techniques?",
];

export default function Chat() {
  const { id, userId } = useLocalSearchParams<{
    id: string;
    userId?: string;
  }>();
  const { currentUser, state, sendMessage, deleteMessage } = useApp();
  const counselor = state.counselors.find((item) => item.id === id);
  const isCounselor = currentUser?.role === "counselor";
  const conversationUserId = isCounselor ? userId : currentUser?.id;
  const student = state.users.find((item) => item.id === conversationUserId);
  const ownSender = isCounselor ? "counselor" : "student";
  const [text, setText] = useState("");
  const messages = state.messages
    .filter(
      (message) =>
        message.counselorId === id && message.userId === conversationUserId,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const nextAppointment = state.appointments
    .filter(
      (appointment) =>
        appointment.counselorId === id &&
        appointment.userId === conversationUserId &&
        appointment.status === "upcoming",
    )
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )[0];

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isCounselor ? "/(counselor-tabs)/chat" : "/(tabs)/inbox");
  };

  if (!counselor) {
    return (
      <Screen>
        <Text style={styles.errorText}>Counselor not found.</Text>
      </Screen>
    );
  }

  if (isCounselor && !conversationUserId) {
    return (
      <Screen>
        <Text style={styles.errorText}>
          Select a student conversation to continue.
        </Text>
      </Screen>
    );
  }

  const send = (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !conversationUserId) return;
    sendMessage(
      counselor.id,
      trimmedMessage,
      isCounselor ? conversationUserId : undefined,
    );
    setText("");
  };

  const otherPartyProfileImage = isCounselor
    ? student?.profileImage
    : undefined;
  const otherPartyName = isCounselor
    ? studentDisplayName(student)
    : counselor.name.split(",")[0];
  const otherPartyColor = isCounselor
    ? (student?.avatarColor ?? colors.teal)
    : counselor.avatarColor;

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll={false} padded={false}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={20} color={colors.tealDark} />
            </Pressable>
            <Avatar
              name={otherPartyName}
              color={otherPartyColor}
              size={38}
              profileType={isCounselor ? "student" : "counselor"}
              profileImage={otherPartyProfileImage}
            />
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherPartyName}
              </Text>
              <View style={styles.headerStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSub}>
                  {isCounselor
                    ? "Student conversation"
                    : "Private conversation"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() =>
                router.push(
                  isCounselor && student
                    ? `/counselor-student/${student.id}`
                    : "/(tabs)/sos",
                )
              }
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel={
                isCounselor ? "View student details" : "Open safety center"
              }
            >
              <Ionicons
                name={
                  isCounselor
                    ? "ellipsis-horizontal"
                    : "shield-checkmark-outline"
                }
                size={18}
                color={colors.tealDark}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.dayDivider}>
              {messages.length
                ? new Date(messages[messages.length - 1].createdAt)
                    .toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                    .toUpperCase()
                : "PRIVATE CONVERSATION"}
            </Text>
            {nextAppointment ? (
              <View style={styles.appointmentNotice}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={colors.tealDark}
                />
                <Text style={styles.appointmentNoticeText}>
                  Next session ·{" "}
                  {new Date(
                    `${nextAppointment.date}T12:00:00`,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  , {nextAppointment.time}
                </Text>
              </View>
            ) : null}

            {messages.length ? (
              messages.map((message) => {
                const isMine = message.sender === ownSender;
                return (
                  <Pressable
                    key={message.id}
                    onLongPress={() =>
                      isMine &&
                      Alert.alert("Delete message?", undefined, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteMessage(message.id),
                        },
                      ])
                    }
                    style={[
                      styles.messageLine,
                      isMine ? styles.messageMine : styles.messageTheirs,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleTheirs,
                      ]}
                    >
                      <Text style={styles.messageText}>{message.text}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.createdAt).toLocaleTimeString(
                          undefined,
                          { hour: "numeric", minute: "2-digit" },
                        )}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Card style={styles.emptyConversation}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color={colors.teal}
                />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptyText}>
                  Your messages here are private to you and your counselor.
                </Text>
              </Card>
            )}
          </ScrollView>

          {!isCounselor ? (
            <View style={styles.quickReplies}>
              <Text style={styles.quickReplyLabel}>Quick replies</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickReplyRow}
              >
                {quickReplies.map((reply) => (
                  <Pressable
                    key={reply}
                    onPress={() => send(reply)}
                    style={({ pressed }) => [
                      styles.quickReply,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => send(text)}
              placeholder="Type a confidential message..."
              placeholderTextColor="#91A5A0"
              style={styles.input}
              accessibilityLabel="Type a message"
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={() => send(text)}
              disabled={!text.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                !text.trim() && styles.sendDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="send" size={17} color={colors.white} />
            </Pressable>
          </View>
          {!isCounselor ? (
            <Pressable
              onPress={() => router.push("/(tabs)/sos")}
              style={styles.crisisLink}
              accessibilityRole="button"
            >
              <View style={styles.crisisDot} />
              <Text style={styles.crisisText}>
                Immediate distress or crisis? Tap for 24/7 support.
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 7, paddingBottom: 4 },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 22,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  headerTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  headerStatus: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#46B78B",
  },
  headerSub: { color: colors.muted, fontSize: 13 },
  headerAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesScroll: { flex: 1 },
  messagesContent: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  dayDivider: {
    alignSelf: "center",
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  appointmentNotice: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  appointmentNoticeText: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: "600",
  },
  messageLine: { maxWidth: "88%", flexDirection: "row" },
  messageMine: { alignSelf: "flex-end" },
  messageTheirs: { alignSelf: "flex-start" },
  bubble: {
    maxWidth: "100%",
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 7,
    borderWidth: 1,
    borderRadius: 13,
  },
  bubbleMine: {
    borderColor: "#D1E9E1",
    backgroundColor: "#E5F3EF",
    borderBottomRightRadius: 5,
  },
  bubbleTheirs: {
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 5,
  },
  messageText: { color: "#40554F", fontSize: 15, lineHeight: 19 },
  messageTime: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
  },
  emptyConversation: { alignItems: "center", padding: 18, borderRadius: 14 },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 7,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 4,
  },
  quickReplies: { paddingTop: 9, paddingBottom: 5 },
  quickReplyLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  quickReplyRow: { gap: 7, paddingRight: 8 },
  quickReply: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  quickReplyText: { color: "#62756F", fontSize: 13 },
  composer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#43AFA0",
  },
  sendDisabled: { opacity: 0.5 },
  crisisLink: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  crisisDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  crisisText: { color: colors.muted, fontSize: 12 },
  pressed: { opacity: 0.78 },
  errorText: { color: colors.muted, fontSize: 14 },
});
