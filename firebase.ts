import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    getReactNativePersistence,
    initializeAuth,
    type User as FirebaseUser,
} from "firebase/auth";
import { doc, getFirestore, runTransaction, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import type { User } from "./types";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  throw new Error(
    "Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values to .env.local.",
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function initializeFirebaseAuth() {
  try {
    return initializeAuth(app, {
      persistence:
        Platform.OS === "web"
          ? browserLocalPersistence
          : getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/already-initialized"
    ) {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = initializeFirebaseAuth();

export const db = getFirestore(app);

type StoredProfile = Omit<User, "id" | "email">;

function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "permission-denied":
      return "Firebase Authentication worked, but Firestore denied access. Create the Firestore database and deploy the rules configured in firebase.json to project mindcare-e08dd.";
    case "unavailable":
      return "Could not reach Firestore. Check your internet connection and confirm the Firestore database is enabled for project mindcare-e08dd.";
    case "not-found":
      return "The Firestore database is not available for project mindcare-e08dd. Create it in Firebase Console, then deploy the rules configured in firebase.json.";
    case "failed-precondition":
      return "Firestore needs setup before MindCare can load your profile. Check the Firestore database and deployed rules for project mindcare-e08dd.";
  }

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use a stronger password with at least 8 characters.";
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return "Firebase Authentication is not set up for this project. In Firebase Console, open Authentication, choose Get started, then enable Email/Password (and Anonymous if you use it). Confirm you are editing project mindcare-e08dd, then restart the app.";
    case "auth/network-request-failed":
      return "Could not reach Firebase. Check your internet connection and try again.";
    default:
      return error instanceof Error
        ? error.message
        : "Firebase authentication failed.";
  }
}

export { authErrorMessage };

export function profileFromFirebase(
  firebaseUser: FirebaseUser,
  data: Partial<StoredProfile> = {},
): User {
  const email = firebaseUser.email ?? "";
  const role = data.role === "counselor" ? "counselor" : "student";
  return {
    id: firebaseUser.uid,
    name:
      data.name ?? firebaseUser.displayName ?? email.split("@")[0] ?? "Student",
    email,
    role,
    isAnonymous: data.isAnonymous ?? firebaseUser.isAnonymous,
    year: data.year && data.year !== "First year" ? data.year : undefined,
    major: data.major && data.major !== "Undeclared" ? data.major : undefined,
    phone: data.phone,
    bio: data.bio,
    title: data.title,
    specialties: data.specialties,
    avatarColor: data.avatarColor ?? "#F07178",
    profileImage: data.profileImage,
    onboardingComplete: data.onboardingComplete ?? false,
    consentAccepted: data.consentAccepted ?? false,
    hideFromDirectory: data.hideFromDirectory,
  };
}

export function profileDocument(profile: User): StoredProfile {
  const { id: _id, email: _email, ...data } = profile;
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as StoredProfile;
}

export async function getOrCreateProfile(
  firebaseUser: FirebaseUser,
): Promise<User> {
  const profileRef = doc(db, "profiles", firebaseUser.uid);
  const profileData = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (snapshot.exists()) return snapshot.data() as Partial<StoredProfile>;

    const profile = profileFromFirebase(firebaseUser);
    const data = profileDocument(profile);
    transaction.set(profileRef, data);
    return data;
  });
  return profileFromFirebase(firebaseUser, profileData);
}

export async function saveProfile(profile: User): Promise<void> {
  await setDoc(doc(db, "profiles", profile.id), profileDocument(profile));
}
