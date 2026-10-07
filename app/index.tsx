import { router } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { useApp } from "../context/AppContext";

const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

// Ring diameters as a fraction of screen width (all share one center)
const RINGS = [
  { ratio: 0.84, color: "rgba(95, 125, 121, 0.28)" },
  { ratio: 0.67, color: "rgba(95, 125, 121, 0.22)" },
  { ratio: 0.5, color: "rgba(95, 125, 121, 0.16)" },
];

export default function Splash() {
  const { width, height } = useWindowDimensions();
  const { currentUser, ready, introReady, state } = useApp();
  const centerX = width / 2;
  const contentCenterY = height * 0.44; // logo + title block
  const ringCenterY = height * 0.42; // rings + glow share this center

  useEffect(() => {
    if (!ready || !introReady) return;

    const timeoutId = setTimeout(() => {
      if (currentUser) {
        if (currentUser.onboardingComplete) {
          router.replace(
            currentUser.consentAccepted
              ? currentUser.role === "admin"
                ? "/admin"
                : currentUser.role === "counselor"
                  ? "/(counselor-tabs)"
                  : "/(tabs)"
              : "/consent"
          );
          return;
        }

        router.replace(state.introCompleted ? "/login" : "/onboarding");
        return;
      }

      router.replace(state.introCompleted ? "/login" : "/onboarding");
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [currentUser, introReady, ready, state.introCompleted]);

  return (
    <View style={styles.splash}>
      {/* Soft radial glows */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="teal" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#2F7F86" stopOpacity="0.55" />
            <Stop offset="0.45" stopColor="#5FB2B0" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#8FD3CC" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="mint" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#A6E8D6" stopOpacity="0.7" />
            <Stop offset="0.6" stopColor="#C4F0E3" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#E6F8F2" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* teal haze behind logo, nudged slightly left */}
        <Ellipse
          cx={centerX - 20}
          cy={ringCenterY}
          rx={width * 0.62}
          ry={width * 0.62}
          fill="url(#teal)"
        />
        {/* mint glow bottom-right */}
        <Ellipse
          cx={width * 0.8}
          cy={height * 0.78}
          rx={width * 0.75}
          ry={width * 0.7}
          fill="url(#mint)"
        />
      </Svg>

      {/* Concentric rings */}
      {RINGS.map(({ ratio, color }, i) => {
        const size = width * ratio;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: color,
              left: centerX - size / 2,
              top: ringCenterY - size / 2,
            }}
          />
        );
      })}

      {/* Tiny dots */}
      <View style={[styles.dot, { top: "28%", left: "15%" }]} pointerEvents="none" />
      <View
        style={[styles.dot, { top: "31%", right: "15%", backgroundColor: "#48A7A0" }]}
        pointerEvents="none"
      />
      <View style={[styles.dot, { top: "42%", left: "27%" }]} pointerEvents="none" />
      <View style={[styles.dot, { top: "42%", right: "26%" }]} pointerEvents="none" />
      <View style={[styles.dot, { top: "61%", left: "26%" }]} pointerEvents="none" />
      <View style={[styles.dot, { top: "72%", left: "60%" }]} pointerEvents="none" />

      {/* Logo + text */}
      <View
        style={[styles.centerContent, { top: 0, height: contentCenterY * 2 }]}
        pointerEvents="none"
      >
        <Image
          source={require("../assets/images/logo.jpg")}
          style={styles.logo}
          accessibilityLabel="MindCare logo"
        />
        <Text style={styles.titleText}>MindCare</Text>
        <Text style={styles.subtitleText}>YOUR MENTAL WELLNESS COMPANION</Text>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer} pointerEvents="none">
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.captionText}>Entering your serene space…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#F6F9F8",
  },
  dot: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#4F6A72",
    opacity: 0.7,
  },
  centerContent: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 13,
    marginBottom: 10,
    resizeMode: "cover",
  },
  titleText: {
    fontFamily: SERIF,
    fontSize: 38,
    fontWeight: "400",
    color: "#1F2B2E",
    letterSpacing: -1,
    lineHeight: 46,
  },
  subtitleText: {
    marginTop: 14,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: "#2B3A3D",
    textAlign: "center",
  },
  footerContainer: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  progressTrack: {
    width: 125,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#D3E4E1",
    overflow: "hidden",
  },
  progressFill: {
    width: "45%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#3FCFD0",
  },
  captionText: {
    marginTop: 16,
    fontSize: 12.5,
    color: "#7A8886",
    letterSpacing: 0.2,
  },
});