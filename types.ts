import type { MoodKey } from './constants/theme';

export type UserRole = 'student' | 'counselor';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAnonymous?: boolean;
  year?: string;
  major?: string;
  phone?: string;
  bio?: string;
  title?: string;
  specialties?: string[];
  avatarColor: string;
  onboardingComplete: boolean;
  consentAccepted: boolean;
  hideFromDirectory?: boolean;
};

export type MoodEntry = {
  id: string;
  userId: string;
  mood: MoodKey;
  stressLevel: number;
  note: string;
  createdAt: string;
};

export type Counselor = {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  rating: number;
  years: number;
  avatarColor: string;
};

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'pending';
export type AppointmentType = 'video' | 'chat' | 'in-person';

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
  clinicalNotes?: string;
  isAnonymous?: boolean;
};

export type Message = {
  id: string;
  counselorId: string;
  userId: string;
  sender: 'student' | 'counselor';
  text: string;
  createdAt: string;
};

export type CrisisResource = {
  id: string;
  title: string;
  description: string;
  phone?: string;
  category: 'immediate' | 'campus' | 'coping';
};

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  shareEmergencyStatus?: boolean;
};

export type CrisisPlan = {
  userId: string;
  warningSigns: string;
  copingStrategies: string;
  reasonsToLive: string;
};

export type SessionFeedback = {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  rating: number;
  comment: string;
  hideNameFromCounselor?: boolean;
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

export type CounselorAvailability = {
  counselorId: string;
  isAcceptingSessions: boolean;
  recurringWeekly?: boolean;
  sessionFormats?: { key: 'standard' | 'quick' | 'urgent'; enabled: boolean }[];
  deliveryMethods?: AppointmentType[];
  days: {
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
    enabled: boolean;
    start: string;
    end: string;
  }[];
  bufferMin?: number;
};

export type CounselorNotification = {
  id: string;
  counselorId: string;
  title: string;
  message: string;
  type: 'request' | 'chat' | 'crisis' | 'system';
  createdAt: string;
  read: boolean;
  appointmentId?: string;
  studentId?: string;
};

export type AppState = {
  users: User[];
  currentUserId: string | null;
  introCompleted?: boolean;
  introConsentAccepted?: boolean;
  moods: MoodEntry[];
  counselors: Counselor[];
  appointments: Appointment[];
  messages: Message[];
  crisisResources: CrisisResource[];
  contacts: EmergencyContact[];
  crisisPlans: CrisisPlan[];
  feedback: SessionFeedback[];
  settings: AppSettings[];
  availabilities?: CounselorAvailability[];
  notifications?: CounselorNotification[];
};
