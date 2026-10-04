import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";

const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export default function Splash() {
  const { ready, introReady, currentUser, state } = useApp();

  useEffect(() => {
    if (!ready || !introReady) return;

    const timer = setTimeout(() => {
      const route = currentUser
        ? !currentUser.onboardingComplete
          ? "/onboarding"
          : currentUser.consentAccepted
            ? currentUser.role === "counselor"
              ? "/(counselor-tabs)"
              : "/(tabs)"
            : "/consent"
        : state.introCompleted
          ? "/login"
          : "/onboarding";
      router.replace(route);
    }, 1200);

    return () => clearTimeout(timer);
  }, [ready, introReady, currentUser, state.introCompleted]);

  const splashContent = (
    <View style={styles.splash}>
      <View style={styles.glowCenterContainer} pointerEvents="none">
        <LinearGradient
          colors={[
            "rgba(124, 214, 200, 0.35)",
            "rgba(206, 241, 234, 0.14)",
            "rgba(245, 250, 248, 0)",
          ]}
          style={styles.glowCenter}
        />
      </View>

      <View style={styles.ringOuter} pointerEvents="none" />
      <View style={styles.ringMiddle} pointerEvents="none" />
      <View style={styles.ringInner} pointerEvents="none" />

      <View style={[styles.dot, styles.dot1]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot2]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot3]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot4]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot5]} pointerEvents="none" />

      <View style={styles.centerContent} pointerEvents="none">
        <View style={styles.logoBadge}>
          <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
        </View>

        <Text style={styles.titleText}>MindCare</Text>
        <Text style={styles.subtitleText}>YOUR MENTAL WELLNESS COMPANION</Text>
      </View>

      <View style={styles.footerContainer} pointerEvents="none">
        <View style={styles.progressTrack} />
        <Text style={styles.captionText}>Entering your serene space...</Text>
      </View>
    </View>
  );

  return splashContent;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#F2F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  glowCenterContainer: {
    position: "absolute",
    top: "14%",
    width: 420,
    height: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCenter: {
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.8,
  },
  ringOuter: {
    position: "absolute",
    top: "17%",
    width: 396,
    height: 396,
    borderRadius: 198,
    borderWidth: 1,
    borderColor: "rgba(90, 121, 120, 0.22)",
  },
  ringMiddle: {
    position: "absolute",
    top: "22%",
    width: 312,
    height: 312,
    borderRadius: 156,
    borderWidth: 1,
    borderColor: "rgba(90, 121, 120, 0.18)",
  },
  ringInner: {
    position: "absolute",
    top: "27%",
    width: 246,
    height: 246,
    borderRadius: 123,
    borderWidth: 1,
    borderColor: "rgba(90, 121, 120, 0.12)",
  },
  dot: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "#4FA4A0",
  },
  dot1: { top: "22%", left: "31%", width: 6, height: 6 },
  dot2: { top: "29%", right: "22%", width: 5, height: 5 },
  dot3: {
    top: "37%",
    left: "20%",
    width: 4,
    height: 4,
    backgroundColor: "#758B89",
  },
  dot4: {
    top: "48%",
    right: "19%",
    width: 4,
    height: 4,
    backgroundColor: "#758B89",
  },
  dot5: { top: "64%", right: "34%", width: 5, height: 5 },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#4BA89E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#2F665F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  titleText: {
    fontFamily: SERIF,
    fontSize: 48,
    fontWeight: "400",
    color: "#1F3C3B",
    letterSpacing: -1.2,
    lineHeight: 54,
  },
  subtitleText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#4A6765",
    textAlign: "center",
  },
  footerContainer: {
    position: "absolute",
    bottom: 62,
    alignItems: "center",
  },
  progressTrack: {
    width: 142,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#7AC8BF",
    opacity: 0.9,
  },
  captionText: {
    marginTop: 18,
    fontSize: 13,
    color: "#6A7C7B",
    fontWeight: "400",
    letterSpacing: 0.15,
  },
});
