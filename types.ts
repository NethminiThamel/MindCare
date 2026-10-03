export type UserRole = 'student' | 'counselor' | 'admin';
export type AppointmentStatus = 'pending' | 'upcoming' | 'cancelled' | 'completed' | 'rescheduled' | 'no-show';
export type AppointmentType = 'initial' | 'follow-up' | 'crisis' | 'check-in';
export type MoodKey = 'happy' | 'calm' | 'anxious' | 'sad' | 'angry' | 'overwhelmed';

export type MoodEntry = {
  id: string;
  userId: string;
  mood: MoodKey;
  stressLevel: number;
  note: string;
  createdAt: string;
};

export type Appointment = {
  id: string;
  userId: string;
  counselorId: string;
  date: string;
  time: string;
  durationMin: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  isAnonymous?: boolean;
};

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export type CrisisPlan = {
  id?: string;
  userId: string;
  title: string;
  steps: string[];
  safePeople?: string[];
};

export type SessionFeedback = {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  rating: number;
  comment: string;
  hideNameFromCounselor: boolean;
  createdAt: string;
};

export type AppSettings = {
  userId: string;
  appointmentReminders: boolean;
  moodReminders: boolean;
  chatAlerts: boolean;
  shareMoodWithCounselor: boolean;
  privateJournal: boolean;
  shareEmergencyStatus?: boolean;
  sameDayAlerts?: boolean;
  wellnessCheckIns?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  allowTrustedContactInCrisis?: boolean;
  shareLocationDuringCrisis?: boolean;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarColor?: string;
  onboardingComplete: boolean;
  consentAccepted: boolean;
  isAnonymous?: boolean;
};

export type CounselorAvailabilityDay = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  enabled: boolean;
  start: string;
  end: string;
};

export type CounselorAvailability = {
  counselorId: string;
  isAcceptingSessions: boolean;
  recurringWeekly: boolean;
  sessionFormats: Array<{ key: 'standard' | 'quick' | 'urgent'; enabled: boolean }>;
  deliveryMethods: Array<'video' | 'chat' | 'in-person'>;
  days: CounselorAvailabilityDay[];
};

export type CounselorNotification = {
  id: string;
  userId?: string;
  counselorId?: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type AppState = {
  users: User[];
  currentUserId: string | null;
  moods: MoodEntry[];
  appointments: Appointment[];
  messages: Array<{
    id: string;
    counselorId: string;
    userId: string;
    sender: 'student' | 'counselor';
    text: string;
    createdAt: string;
  }>;
  contacts: EmergencyContact[];
  crisisPlans: CrisisPlan[];
  feedback: SessionFeedback[];
  settings: AppSettings[];
  availabilities?: CounselorAvailability[];
  notifications?: CounselorNotification[];
  introCompleted?: boolean;
};

export type AppContextState = AppState;
