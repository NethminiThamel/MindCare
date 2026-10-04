import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    setDoc,
    where,
    type DocumentData,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, authErrorMessage, db, saveProfile } from "./firebase";
import type {
    AppSettings,
    AppState,
    Appointment,
    Counselor,
    CounselorAvailability,
    CounselorNotification,
    CrisisPlan,
    CrisisResource,
    EmergencyContact,
    Message,
    MoodEntry,
    SessionFeedback,
    User,
} from "./types";

type Identified = { id: string };

const defaultSettings = (userId: string): AppSettings => ({
  userId,
  appointmentReminders: true,
  moodReminders: true,
  chatAlerts: true,
  shareMoodWithCounselor: false,
  privateJournal: true,
  shareEmergencyStatus: false,
  sameDayAlerts: false,
  wellnessCheckIns: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  allowTrustedContactInCrisis: true,
  shareLocationDuringCrisis: false,
});

function reportError(
  onError: (message: string | null) => void,
  error: unknown,
) {
  console.error("Firestore data operation failed.", error);
  onError(authErrorMessage(error));
}

function cleanData<T extends object>(value: T): DocumentData {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, entry]) => key !== "id" && entry !== undefined,
    ),
  );
}

function recordsFromSnapshot<T extends object>(
  documents: QueryDocumentSnapshot<DocumentData>[],
  getId: (snapshot: QueryDocumentSnapshot<DocumentData>) => string = (
    snapshot,
  ) => snapshot.id,
): T[] {
  return documents.map(
    (snapshot) =>
      ({
        ...snapshot.data(),
        id: getId(snapshot),
      }) as T,
  );
}

function normalizeCounselor(counselor: Counselor): Counselor {
  return {
    ...counselor,
    specialties: Array.isArray(counselor.specialties)
      ? counselor.specialties.filter(
          (specialty): specialty is string => typeof specialty === "string",
        )
      : [],
  };
}

function listenToCollection<T extends object>(
  path: string[],
  onValue: (items: T[]) => void,
  onError: (message: string | null) => void,
  filters: Array<[string, unknown]> = [],
  getId?: (snapshot: QueryDocumentSnapshot<DocumentData>) => string,
) {
  const source = collection(db, path[0], ...path.slice(1));
  const reference = filters.length
    ? query(
        source,
        ...filters.map(([field, value]) => where(field, "==", value)),
      )
    : source;
  return onSnapshot(
    reference,
    (snapshot) => onValue(recordsFromSnapshot<T>(snapshot.docs, getId)),
    (error) => reportError(onError, error),
  );
}

function listenToPrivateDocument<T>(
  path: string[],
  fallback: T,
  onValue: (value: T) => void,
  onError: (message: string | null) => void,
) {
  const reference = doc(db, path[0], ...path.slice(1));
  return onSnapshot(
    reference,
    (snapshot) => {
      if (snapshot.exists()) {
        onValue(snapshot.data() as T);
        return;
      }

      onValue(fallback);
      void setDoc(reference, cleanData(fallback as object)).catch(
        (error: unknown) => {
          reportError(onError, error);
        },
      );
    },
    (error) => reportError(onError, error),
  );
}

function subscribeChanges<T extends Identified>(
  before: T[],
  after: T[],
  reference: (item: T) => ReturnType<typeof doc>,
  extra?: (item: T) => Promise<void>,
) {
  const previous = new Map(before.map((item) => [item.id, item]));
  const next = new Map(after.map((item) => [item.id, item]));
  const writes: Promise<void>[] = [];

  for (const item of after) {
    const oldItem = previous.get(item.id);
    if (oldItem && JSON.stringify(oldItem) === JSON.stringify(item)) continue;
    const write = setDoc(reference(item), cleanData(item));
    writes.push(extra ? write.then(() => extra(item)) : write);
  }

  for (const item of before) {
    if (!next.has(item.id)) writes.push(deleteDoc(reference(item)));
  }

  return writes;
}

export function emptyAppState(): AppState {
  return {
    users: [],
    currentUserId: null,
    moods: [],
    counselors: [],
    appointments: [],
    messages: [],
    crisisResources: [],
    contacts: [],
    crisisPlans: [],
    feedback: [],
    settings: [],
    availabilities: [],
    notifications: [],
  };
}

export async function migrateLegacyAppData(
  _profile: User,
): Promise<AppState | null> {
  return null;
}

export async function removeLegacyLocalData(): Promise<void> {
  return;
}

export function subscribeAppData(
  _firebaseUser: unknown,
  profile: User,
  onPatch: (patch: Partial<AppState>) => void,
  onError: (message: string | null) => void,
): () => void {
  const userId = profile.id;
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    listenToCollection<Counselor>(
      ["counselors"],
      (counselors) =>
        onPatch({ counselors: counselors.map(normalizeCounselor) }),
      onError,
    ),
  );
  unsubscribers.push(
    listenToCollection<CrisisResource>(
      ["crisisResources"],
      (crisisResources) => onPatch({ crisisResources }),
      onError,
    ),
  );
  unsubscribers.push(
    listenToCollection<CounselorAvailability>(
      ["counselorAvailability"],
      (availabilities) => onPatch({ availabilities }),
      onError,
    ),
  );
  unsubscribers.push(
    listenToCollection<Appointment>(
      ["appointments"],
      (appointments) => onPatch({ appointments }),
      onError,
      [[profile.role === "counselor" ? "counselorId" : "userId", userId]],
    ),
  );
  unsubscribers.push(
    listenToCollection<Message>(
      ["messages"],
      (messages) => onPatch({ messages }),
      onError,
      [[profile.role === "counselor" ? "counselorId" : "userId", userId]],
    ),
  );
  unsubscribers.push(
    listenToCollection<SessionFeedback>(
      ["feedback"],
      (feedback) => onPatch({ feedback }),
      onError,
      [[profile.role === "counselor" ? "counselorId" : "userId", userId]],
    ),
  );

  if (profile.role === "student") {
    onPatch({ users: [profile] });
    unsubscribers.push(
      listenToCollection<MoodEntry>(
        ["accounts", userId, "moods"],
        (moods) => onPatch({ moods }),
        onError,
      ),
    );
    unsubscribers.push(
      listenToCollection<EmergencyContact>(
        ["accounts", userId, "contacts"],
        (contacts) => onPatch({ contacts }),
        onError,
      ),
    );
    unsubscribers.push(
      listenToPrivateDocument<AppSettings>(
        ["accounts", userId, "private", "settings"],
        defaultSettings(userId),
        (settings) => onPatch({ settings: [{ ...settings, userId }] }),
        onError,
      ),
    );
    unsubscribers.push(
      listenToPrivateDocument<Omit<CrisisPlan, "userId">>(
        ["accounts", userId, "private", "crisisPlan"],
        { warningSigns: "", copingStrategies: "", reasonsToLive: "" },
        (crisisPlan) => {
          const hasContent = Object.values(crisisPlan).some((value) =>
            value.trim(),
          );
          onPatch({
            crisisPlans: hasContent ? [{ ...crisisPlan, userId }] : [],
          });
        },
        onError,
      ),
    );
  } else {
    onPatch({ users: [profile] });
    unsubscribers.push(
      listenToCollection<User>(
        ["studentDirectory"],
        (students) =>
          onPatch({
            users: [
              profile,
              ...students.map((student) => ({
                ...student,
                email: "",
                role: "student" as const,
                onboardingComplete: true,
                consentAccepted: true,
              })),
            ],
          }),
        onError,
      ),
    );
    unsubscribers.push(
      listenToCollection<MoodEntry>(
        ["sharedMoods"],
        (moods) => onPatch({ moods }),
        onError,
        [["counselorId", userId]],
        (snapshot) => snapshot.id.slice(0, -(userId.length + 1)),
      ),
    );
    unsubscribers.push(
      listenToCollection<CounselorNotification>(
        ["counselors", userId, "notifications"],
        (notifications) => onPatch({ notifications }),
        onError,
      ),
    );
  }

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function syncAppStateChanges(
  before: AppState,
  after: AppState,
  actor: User,
): Promise<void> {
  if (auth.currentUser?.uid !== actor.id) return;

  const writes: Promise<void>[] = [];
  const userId = actor.id;
  let moodSharingChanged = false;

  if (actor.role === "student") {
    writes.push(
      ...subscribeChanges(before.moods, after.moods, (item) =>
        doc(db, "accounts", userId, "moods", item.id),
      ),
    );
    writes.push(
      ...subscribeChanges(before.contacts, after.contacts, (item) =>
        doc(db, "accounts", userId, "contacts", item.id),
      ),
    );
    writes.push(
      ...subscribeChanges(
        before.appointments.filter((item) => item.userId === userId),
        after.appointments.filter((item) => item.userId === userId),
        (item) => doc(db, "appointments", item.id),
        async (appointment) => {
          const assignmentRef = doc(
            db,
            "counselorAssignments",
            `${userId}_${appointment.counselorId}`,
          );
          const activeAppointment = after.appointments.find(
            (item) =>
              item.userId === userId &&
              item.counselorId === appointment.counselorId &&
              item.status !== "cancelled",
          );
          if (!activeAppointment) {
            await deleteDoc(assignmentRef);
            return;
          }
          await setDoc(assignmentRef, {
            studentId: userId,
            counselorId: appointment.counselorId,
            appointmentId: activeAppointment.id,
          });
        },
      ),
    );
    writes.push(
      ...subscribeChanges(
        before.feedback.filter((item) => item.userId === userId),
        after.feedback.filter((item) => item.userId === userId),
        (item) => doc(db, "feedback", item.id),
      ),
    );

    const beforeSettings = before.settings.find(
      (item) => item.userId === userId,
    );
    const afterSettings = after.settings.find((item) => item.userId === userId);
    moodSharingChanged =
      beforeSettings?.shareMoodWithCounselor !==
      afterSettings?.shareMoodWithCounselor;
    if (
      afterSettings &&
      JSON.stringify(beforeSettings) !== JSON.stringify(afterSettings)
    ) {
      writes.push(
        setDoc(
          doc(db, "accounts", userId, "private", "settings"),
          cleanData(afterSettings),
        ),
      );
    }

    const beforePlan = before.crisisPlans.find(
      (item) => item.userId === userId,
    );
    const afterPlan = after.crisisPlans.find((item) => item.userId === userId);
    if (afterPlan && JSON.stringify(beforePlan) !== JSON.stringify(afterPlan)) {
      writes.push(
        setDoc(doc(db, "accounts", userId, "private", "crisisPlan"), {
          warningSigns: afterPlan.warningSigns,
          copingStrategies: afterPlan.copingStrategies,
          reasonsToLive: afterPlan.reasonsToLive,
        }),
      );
    } else if (beforePlan && !afterPlan) {
      writes.push(
        deleteDoc(doc(db, "accounts", userId, "private", "crisisPlan")),
      );
    }
  } else {
    writes.push(
      ...subscribeChanges(
        before.appointments.filter((item) => item.counselorId === userId),
        after.appointments.filter((item) => item.counselorId === userId),
        (item) => doc(db, "appointments", item.id),
      ),
    );
    writes.push(
      ...subscribeChanges(
        before.messages.filter((item) => item.counselorId === userId),
        after.messages.filter((item) => item.counselorId === userId),
        (item) => doc(db, "messages", item.id),
      ),
    );
    writes.push(
      ...subscribeChanges(
        before.notifications ?? [],
        after.notifications ?? [],
        (item) => doc(db, "counselors", userId, "notifications", item.id),
      ),
    );
    const beforeAvailability = before.availabilities?.find(
      (item) => item.counselorId === userId,
    );
    const afterAvailability = after.availabilities?.find(
      (item) => item.counselorId === userId,
    );
    if (
      afterAvailability &&
      JSON.stringify(beforeAvailability) !== JSON.stringify(afterAvailability)
    ) {
      writes.push(
        setDoc(
          doc(db, "counselorAvailability", userId),
          cleanData(afterAvailability),
        ),
      );
    }
  }

  const beforeMessages =
    actor.role === "student"
      ? before.messages.filter((item) => item.userId === userId)
      : [];
  const afterMessages =
    actor.role === "student"
      ? after.messages.filter((item) => item.userId === userId)
      : [];
  if (actor.role === "student") {
    writes.push(
      ...subscribeChanges(beforeMessages, afterMessages, (item) =>
        doc(db, "messages", item.id),
      ),
    );
  }

  await Promise.all(writes);

  if (actor.role !== "student") return;

  const previousCounselorIds = new Set(
    before.appointments
      .filter((item) => item.userId === userId && item.status !== "cancelled")
      .map((item) => item.counselorId),
  );
  const counselorIds = new Set(
    after.appointments
      .filter((item) => item.userId === userId && item.status !== "cancelled")
      .map((item) => item.counselorId),
  );
  const counselorSetChanged =
    previousCounselorIds.size !== counselorIds.size ||
    [...previousCounselorIds].some((id) => !counselorIds.has(id));
  const beforeMoods = new Map(before.moods.map((item) => [item.id, item]));
  const afterMoods = new Map(after.moods.map((item) => [item.id, item]));
  const moodIds = new Set<string>();

  for (const mood of after.moods) {
    if (JSON.stringify(beforeMoods.get(mood.id)) !== JSON.stringify(mood))
      moodIds.add(mood.id);
  }
  for (const mood of before.moods) {
    if (!afterMoods.has(mood.id)) moodIds.add(mood.id);
  }
  if (moodSharingChanged || counselorSetChanged) {
    for (const mood of before.moods) moodIds.add(mood.id);
    for (const mood of after.moods) moodIds.add(mood.id);
  }

  const shouldShareMoods =
    after.settings.find((item) => item.userId === userId)
      ?.shareMoodWithCounselor === true;
  const shareWrites: Promise<void>[] = [];
  for (const moodId of moodIds) {
    const mood = afterMoods.get(moodId);
    for (const counselorId of new Set([
      ...previousCounselorIds,
      ...counselorIds,
    ])) {
      const sharedRef = doc(db, "sharedMoods", `${moodId}_${counselorId}`);
      if (!mood || !shouldShareMoods || !counselorIds.has(counselorId)) {
        shareWrites.push(deleteDoc(sharedRef));
        continue;
      }

      const appointment = after.appointments.find(
        (item) =>
          item.userId === userId &&
          item.counselorId === counselorId &&
          item.status !== "cancelled",
      );
      if (!appointment) continue;

      const assignmentRef = doc(
        db,
        "counselorAssignments",
        `${userId}_${counselorId}`,
      );
      shareWrites.push(
        setDoc(assignmentRef, {
          studentId: userId,
          counselorId,
          appointmentId: appointment.id,
        }).then(() => setDoc(sharedRef, cleanData({ ...mood, counselorId }))),
      );
    }
  }
  await Promise.all(shareWrites);
}

export async function syncProfileVisibility(profile: User): Promise<void> {
  await saveProfile(profile);
  if (profile.role !== "student") return;

  const directoryRef = doc(db, "studentDirectory", profile.id);
  const sharedProfileRef = doc(db, "sharedProfiles", profile.id);
  const hasConsented = profile.onboardingComplete && profile.consentAccepted;
  const shouldPublishDirectory = hasConsented && !profile.hideFromDirectory;

  if (!hasConsented) {
    await Promise.all([deleteDoc(directoryRef), deleteDoc(sharedProfileRef)]);
    return;
  }

  const directory = cleanData({
    name: profile.isAnonymous ? "Anonymous Student" : profile.name,
    isAnonymous: profile.isAnonymous ?? false,
    year: profile.year,
    major: profile.major,
    avatarColor: profile.avatarColor,
    profileImage: profile.profileImage,
  });
  const shared = cleanData({
    name: profile.isAnonymous ? "Anonymous Student" : profile.name,
    isAnonymous: profile.isAnonymous ?? false,
    year: profile.year,
    major: profile.major,
    avatarColor: profile.avatarColor,
    profileImage: profile.profileImage,
    bio: profile.bio,
  });

  const writes = [setDoc(sharedProfileRef, shared)];
  if (shouldPublishDirectory) writes.push(setDoc(directoryRef, directory));
  else writes.push(deleteDoc(directoryRef));
  await Promise.all(writes);
}
