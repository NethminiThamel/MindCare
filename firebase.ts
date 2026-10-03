import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { User } from './types';

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-app.firebaseapp.com',
  projectId: 'demo-app',
  appId: 'demo-app-id',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const authErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Authentication failed.';
};

export async function getOrCreateProfile(firebaseUser: FirebaseUser): Promise<User> {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    name: firebaseUser.displayName ?? 'MindCare User',
    role: 'student',
    phone: firebaseUser.phoneNumber ?? undefined,
    onboardingComplete: false,
    consentAccepted: false,
  };
}

export function profileFromFirebase(
  firebaseUser: FirebaseUser,
  overrides: Partial<User> = {}
): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    name: firebaseUser.displayName ?? 'MindCare User',
    role: 'student',
    phone: firebaseUser.phoneNumber ?? undefined,
    onboardingComplete: false,
    consentAccepted: false,
    ...overrides,
  };
}

export async function saveProfile(profile: User): Promise<void> {
  void profile;
}
