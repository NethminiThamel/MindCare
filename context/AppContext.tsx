import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, authErrorMessage, getOrCreateProfile, profileFromFirebase, saveProfile } from '../firebase';
import {
  emptyAppState,
  migrateLegacyAppData,
  removeLegacyLocalData,
  subscribeAppData,
  syncAppStateChanges,
  syncProfileVisibility,
} from '../firebase-data';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AppSettings,
  AppState,
  CounselorAvailability,
  CounselorNotification,
  CrisisPlan,
  EmergencyContact,
  MoodEntry,
  SessionFeedback,
  User,
} from '../types';
import type { MoodKey } from '../constants/theme';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type AppContextValue = {
  ready: boolean;
  authStartupError: string | null;
  syncError: string | null;
  state: AppState;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ error: string | null; role: User['role'] | null }>;
  resetPassword: (email: string) => Promise<string | null>;
  signup: (input: { name: string; email: string; password: string; phone?: string }) => Promise<string | null>;
  signupAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  acceptConsent: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  addMood: (input: { mood: MoodKey; stressLevel: number; note: string }) => MoodEntry;
  updateMood: (id: string, patch: Partial<MoodEntry>) => void;
  deleteMood: (id: string) => void;
  bookAppointment: (input: {
    counselorId: string;
    date: string;
    time: string;
    type: AppointmentType;
    notes: string;
    isAnonymous?: boolean;
  }) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  respondToAppointmentRequest: (id: string, status: 'upcoming' | 'cancelled') => void;
  sendMessage: (counselorId: string, text: string, studentId?: string) => void;
  deleteMessage: (id: string) => void;
  addContact: (input: Omit<EmergencyContact, 'id' | 'userId'>) => EmergencyContact;
  updateContact: (id: string, patch: Partial<EmergencyContact>) => void;
  deleteContact: (id: string) => void;
  saveCrisisPlan: (plan: Omit<CrisisPlan, 'userId'>) => void;
  submitFeedback: (appointmentId: string, rating: number, comment: string, hideNameFromCounselor?: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateCounselorAvailability: (counselorId: string, patch: Partial<CounselorAvailability>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (counselorId?: string) => void;
  addNotification: (notification: Omit<CounselorNotification, 'id' | 'createdAt' | 'read'>) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyAppState());
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [authStartupError, setAuthStartupError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const replaceState = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  const persist = useCallback((updater: (prev: AppState) => AppState) => {
    const before = stateRef.current;
    const after = updater(before);
    stateRef.current = after;
    setState(after);
    const actor = before.users.find((user) => user.id === before.currentUserId);
    if (!actor || auth.currentUser?.uid !== actor.id) return;
    void syncAppStateChanges(before, after, actor).then(
      () => setSyncError(null),
      (error: unknown) => {
        console.error('Unable to sync MindCare data with Firestore.', error);
        setSyncError(error instanceof Error ? error.message : 'Unable to sync data with Firestore.');
      }
    );
  }, []);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let stopData: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const currentGeneration = ++generation;
        stopData?.();
        stopData = undefined;
        replaceState(() => emptyAppState());
        setSyncError(null);
        setAuthStartupError(null);
        if (!firebaseUser) {
          setReady(true);
          return;
        }

        setReady(false);
        try {
          const profile = await getOrCreateProfile(firebaseUser);
          if (!active || currentGeneration !== generation) return;
          try {
            const legacyState = await migrateLegacyAppData(profile);
            if (legacyState) {
              await syncAppStateChanges(emptyAppState(), legacyState, profile);
              await removeLegacyLocalData();
            }
          } catch (migrationError) {
            console.error('Unable to migrate this account\'s saved data to Firestore.', migrationError);
            setSyncError(
              'Some data saved on this device could not be moved to your Firebase account.'
            );
          }
          if (!active || currentGeneration !== generation) return;
          replaceState(() => ({ ...emptyAppState(), users: [profile], currentUserId: profile.id }));
          stopData = subscribeAppData(
            firebaseUser,
            profile,
            (patch) => replaceState((prev) => ({ ...prev, ...patch })),
            setSyncError
          );
        } catch (error) {
          console.error('Unable to load the signed-in Firebase profile and data.', error);
          setAuthStartupError(
            error instanceof Error ? error.message : 'Unable to load the Firebase account.'
          );
        } finally {
          if (active && currentGeneration === generation) setReady(true);
        }
      },
      (error) => {
        console.error('Firebase authentication state could not be restored.', error);
        setAuthStartupError(error.message);
        setReady(true);
      }
    );

    return () => {
      active = false;
      generation += 1;
      stopData?.();
      unsubscribeAuth();
    };
  }, [replaceState]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const requireUser = useCallback(() => {
    if (!currentUser) throw new Error('Not signed in');
    return currentUser;
  }, [currentUser]);

  const syncUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    const profile = await getOrCreateProfile(firebaseUser);
    await syncProfileVisibility(profile);
    setAuthStartupError(null);
    replaceState((prev) => ({
      ...prev,
      users: [...prev.users.filter((user) => user.id !== profile.id), profile],
      currentUserId: profile.id,
      settings: prev.settings.some((setting) => setting.userId === profile.id)
        ? prev.settings
        : [
            ...prev.settings,
            {
              userId: profile.id,
              appointmentReminders: true,
              moodReminders: true,
              chatAlerts: true,
              shareMoodWithCounselor: false,
              privateJournal: true,
            },
          ],
    }));
    return profile;
  }, [replaceState]);

  const value = useMemo<AppContextValue>(() => {
    return {
      ready,
      authStartupError,
      syncError,
      state,
      currentUser,
      login: async (email, password) => {
        let authenticated = false;
        try {
          const credential = await signInWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password
          );
          authenticated = true;
          const profile = await syncUserProfile(credential.user);
          return { error: null, role: profile.role };
        } catch (error) {
          const message = authErrorMessage(error);
          return {
            error: authenticated
              ? `Firebase signed you in, but MindCare could not load your cloud profile. ${message}`
              : message,
            role: null,
          };
        }
      },
      resetPassword: async (email) => {
        try {
          await sendPasswordResetEmail(auth, email.trim().toLowerCase());
          return null;
        } catch (error) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'auth/user-not-found'
          ) {
            return null;
          }
          return authErrorMessage(error);
        }
      },
      signup: async ({ name, email, password, phone }) => {
        let accountCreated = false;
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password
          );
          accountCreated = true;
          const profile = profileFromFirebase(credential.user, {
            name: name.trim(),
            role: 'student',
            phone: phone?.trim() || undefined,
            avatarColor: '#F07178',
            onboardingComplete: false,
            consentAccepted: false,
          });
          await syncProfileVisibility(profile);
          replaceState((prev) => ({
            ...prev,
            users: [...prev.users.filter((user) => user.id !== profile.id), profile],
            currentUserId: profile.id,
          }));
          return null;
        } catch (error) {
          const message = authErrorMessage(error);
          return accountCreated
            ? `Your Firebase account was created, but MindCare could not save its profile. Do not sign up again; after Firestore is set up, use Log In with this email. ${message}`
            : message;
        }
      },
      signupAnonymously: async () => {
        try {
          const credential = await signInAnonymously(auth);
          const profile = profileFromFirebase(credential.user, {
            name: 'Anonymous Student',
            role: 'student',
            isAnonymous: true,
            avatarColor: '#F07178',
            onboardingComplete: false,
            consentAccepted: false,
          });
          await syncProfileVisibility(profile);
          replaceState((prev) => ({
            ...prev,
            users: [...prev.users.filter((user) => user.id !== profile.id), profile],
            currentUserId: profile.id,
          }));
        } catch (error) {
          throw new Error(authErrorMessage(error));
        }
      },
      logout: async () => {
        await signOut(auth);
      },
      completeOnboarding: async () => {
        const user = currentUser;
        if (!user) {
          persist((prev) => ({ ...prev, introCompleted: true }));
          return;
        }
        const updated = { ...user, onboardingComplete: true };
        await syncProfileVisibility(updated);
        persist((prev) => ({
          ...prev,
          introCompleted: true,
          users: prev.users.map((u) => (u.id === user.id ? updated : u)),
        }));
      },
      acceptConsent: async () => {
        const user = requireUser();
        const updated = { ...user, consentAccepted: true };
        await syncProfileVisibility(updated);
        persist((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? updated : u)),
        }));
      },
      updateProfile: async (patch) => {
        const user = requireUser();
        if (patch.id || patch.email !== undefined || patch.role !== undefined) {
          throw new Error('Email and role changes require a verified account-management flow.');
        }
        const updated = { ...user, ...patch, id: user.id, email: user.email, role: user.role };
        await syncProfileVisibility(updated);
        persist((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? updated : u)),
        }));
      },
      deleteAccount: async () => {
        const user = requireUser();
        if (user.role === 'counselor') {
          throw new Error('Counselor accounts must be deprovisioned by an administrator.');
        }
        const firebaseUser = auth.currentUser;
        if (!firebaseUser || firebaseUser.uid !== user.id) {
          throw new Error('No signed-in Firebase account was found.');
        }
        await deleteDoc(doc(db, 'profiles', user.id));
        try {
          await deleteUser(firebaseUser);
        } catch (error) {
          try {
            await saveProfile(user);
          } catch (restoreError) {
            console.error('Account deletion failed and the Firebase profile could not be restored.', restoreError);
          }
          throw error;
        }
        persist((prev) => ({
          ...prev,
          currentUserId: null,
          users: prev.users.filter((u) => u.id !== user.id),
          moods: prev.moods.filter((m) => m.userId !== user.id),
          appointments: prev.appointments.filter((a) => a.userId !== user.id),
          messages: prev.messages.filter((m) => m.userId !== user.id),
          contacts: prev.contacts.filter((c) => c.userId !== user.id),
          crisisPlans: prev.crisisPlans.filter((p) => p.userId !== user.id),
          feedback: prev.feedback.filter((f) => f.userId !== user.id),
          settings: prev.settings.filter((s) => s.userId !== user.id),
        }));
      },
      addMood: ({ mood, stressLevel, note }) => {
        const user = requireUser();
        const entry: MoodEntry = {
          id: uid(),
          userId: user.id,
          mood,
          stressLevel,
          note,
          createdAt: new Date().toISOString(),
        };
        persist((prev) => ({ ...prev, moods: [entry, ...prev.moods] }));
        return entry;
      },
      updateMood: (id, patch) => {
        persist((prev) => ({
          ...prev,
          moods: prev.moods.map((m) => (m.id === id ? { ...m, ...patch, id: m.id } : m)),
        }));
      },
      deleteMood: (id) => {
        persist((prev) => ({ ...prev, moods: prev.moods.filter((m) => m.id !== id) }));
      },
      bookAppointment: ({ counselorId, date, time, type, notes, isAnonymous }) => {
        const user = requireUser();
        const appt: Appointment = {
          id: uid(),
          userId: user.id,
          counselorId,
          date,
          time,
          durationMin: 50,
          type,
          status: 'pending',
          notes,
          isAnonymous,
        };
        persist((prev) => ({ ...prev, appointments: [appt, ...prev.appointments] }));
        return appt;
      },
      updateAppointment: (id, patch) => {
        persist((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => (a.id === id ? { ...a, ...patch, id: a.id } : a)),
        }));
      },
      setAppointmentStatus: (id, status) => {
        persist((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },
      respondToAppointmentRequest: (id, status) => {
        persist((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },
      sendMessage: (counselorId, text, studentId) => {
        const user = requireUser();
        const senderType = user.role === 'counselor' ? 'counselor' : 'student';
        const conversationUserId = user.role === 'counselor' ? studentId : user.id;
        if (!conversationUserId) return;
        persist((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: uid(),
              counselorId,
              userId: conversationUserId,
              sender: senderType,
              text,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      deleteMessage: (id) => {
        persist((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== id) }));
      },
      addContact: (input) => {
        const user = requireUser();
        const contact: EmergencyContact = { ...input, id: uid(), userId: user.id };
        persist((prev) => ({
          ...prev,
          contacts: [...prev.contacts, contact],
        }));
        return contact;
      },
      updateContact: (id, patch) => {
        persist((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)),
        }));
      },
      deleteContact: (id) => {
        persist((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }));
      },
      saveCrisisPlan: (plan) => {
        const user = requireUser();
        persist((prev) => {
          const others = prev.crisisPlans.filter((p) => p.userId !== user.id);
          return { ...prev, crisisPlans: [...others, { ...plan, userId: user.id }] };
        });
      },
      submitFeedback: (appointmentId, rating, comment, hideNameFromCounselor = false) => {
        const user = requireUser();
        const appointment = state.appointments.find((item) => item.id === appointmentId);
        if (!appointment || appointment.userId !== user.id) {
          throw new Error('Feedback requires one of your own appointments.');
        }
        const item: SessionFeedback = {
          id: uid(),
          appointmentId,
          userId: user.id,
          counselorId: appointment.counselorId,
          rating,
          comment,
          hideNameFromCounselor,
          createdAt: new Date().toISOString(),
        };
        persist((prev) => ({ ...prev, feedback: [item, ...prev.feedback] }));
      },
      updateSettings: (patch) => {
        const user = requireUser();
        persist((prev) => {
          const existing = prev.settings.find((s) => s.userId === user.id);
          const next = existing
            ? prev.settings.map((s) => (s.userId === user.id ? { ...s, ...patch } : s))
            : [
                ...prev.settings,
                {
                  userId: user.id,
                  appointmentReminders: true,
                  moodReminders: true,
                  chatAlerts: true,
                  shareMoodWithCounselor: false,
                  privateJournal: true,
                  shareEmergencyStatus: false,
                  sameDayAlerts: false,
                  wellnessCheckIns: true,
                  quietHoursEnabled: false,
                  quietHoursStart: '22:00',
                  quietHoursEnd: '07:00',
                  allowTrustedContactInCrisis: true,
                  shareLocationDuringCrisis: false,
                  ...patch,
                },
              ];
          return { ...prev, settings: next };
        });
      },
      updateCounselorAvailability: (counselorId, patch) => {
        persist((prev) => {
          const existing = prev.availabilities?.find((a) => a.counselorId === counselorId);
          const defaultAvailability: CounselorAvailability = {
            counselorId,
            isAcceptingSessions: true,
            recurringWeekly: true,
            sessionFormats: [
              { key: 'standard', enabled: true },
              { key: 'quick', enabled: false },
              { key: 'urgent', enabled: false },
            ],
            deliveryMethods: ['video', 'chat', 'in-person'],
            days: [
              { day: 'Mon', enabled: true, start: '09:00', end: '17:00' },
              { day: 'Tue', enabled: true, start: '09:00', end: '17:00' },
              { day: 'Wed', enabled: true, start: '09:00', end: '17:00' },
              { day: 'Thu', enabled: true, start: '09:00', end: '17:00' },
              { day: 'Fri', enabled: true, start: '09:00', end: '15:00' },
              { day: 'Sat', enabled: false, start: '10:00', end: '14:00' },
              { day: 'Sun', enabled: false, start: '10:00', end: '14:00' },
            ],
          };

          const nextAvailability: CounselorAvailability = {
            ...defaultAvailability,
            ...existing,
            ...patch,
            counselorId,
          };

          const nextAvailabilities = existing
            ? (prev.availabilities ?? []).map((a) => (a.counselorId === counselorId ? nextAvailability : a))
            : [...(prev.availabilities ?? []), nextAvailability];

          return {
            ...prev,
            availabilities: nextAvailabilities,
          };
        });
      },
      markNotificationRead: (id) => {
        persist((prev) => ({
          ...prev,
          notifications: prev.notifications?.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },
      markAllNotificationsRead: (counselorId) => {
        persist((prev) => ({
          ...prev,
          notifications: prev.notifications?.map((n) =>
            !counselorId || n.counselorId === counselorId ? { ...n, read: true } : n
          ),
        }));
      },
      addNotification: (notification) => {
        const item: CounselorNotification = {
          ...notification,
          id: uid(),
          createdAt: new Date().toISOString(),
          read: false,
        };
        persist((prev) => ({
          ...prev,
          notifications: [item, ...(prev.notifications ?? [])],
        }));
      },
    };
  }, [authStartupError, currentUser, persist, ready, state, syncError, syncUserProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
