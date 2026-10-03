import type { AppState, User } from './types';

export function emptyAppState(): AppState {
  return {
    users: [],
    currentUserId: null,
    moods: [],
    appointments: [],
    messages: [],
    contacts: [],
    crisisPlans: [],
    feedback: [],
    settings: [],
    availabilities: [],
    notifications: [],
  };
}

export async function migrateLegacyAppData(_profile: User): Promise<AppState | null> {
  return null;
}

export async function removeLegacyLocalData(): Promise<void> {
  return;
}

export function subscribeAppData(
  _firebaseUser: unknown,
  _profile: User,
  _onPatch: (patch: Partial<AppState>) => void,
  _onError: (message: string | null) => void
): () => void {
  return () => undefined;
}

export async function syncAppStateChanges(
  _before: AppState,
  _after: AppState,
  _actor: User
): Promise<void> {
  return;
}

export async function syncProfileVisibility(_profile: User): Promise<void> {
  return;
}
