import type { Appointment, Counselor, User } from '../types';
import { colors } from '../constants/theme';

export function getActiveCounselor(
  currentUser: User | null,
  counselors: Counselor[]
): Counselor | undefined {
  if (!currentUser) return undefined;
  const matched = counselors.find(
    (c) => c.id === currentUser.id
  );
  return matched;
}

export function getActiveCounselorId(
  currentUser: User | null,
  counselors: Counselor[]
): string {
  return getActiveCounselor(currentUser, counselors)?.id ?? currentUser?.id ?? '';
}

export function getRequestUrgency(
  appointment: Pick<Appointment, 'notes'>
): { level: 'urgent' | 'moderate' | 'standard'; label: string; color: string; bg: string } {
  const notesLower = (appointment.notes || '').toLowerCase();
  const isUrgent =
    /urgent|crisis|suicid|panic|severe|emergency|unsafe|overwhelm|breakdown/.test(notesLower);
  if (isUrgent) {
    return {
      level: 'urgent',
      label: 'Urgent Triage',
      color: colors.coral,
      bg: '#FFEAEB',
    };
  }
  const isModerate =
    /anxious|sleep|stress|midterm|exam|struggl|depress/.test(notesLower);
  if (isModerate) {
    return {
      level: 'moderate',
      label: 'Moderate Distress',
      color: '#D97706',
      bg: '#FEF3C7',
    };
  }
  return {
    level: 'standard',
    label: 'Standard Booking',
    color: colors.tealDark,
    bg: '#EAF7F3',
  };
}

export function formatTimeRange(time: string, durationMin = 50): string {
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date();
  start.setHours(hour, minute, 0, 0);

  const end = new Date();
  end.setHours(hour, minute + durationMin, 0, 0);

  const formatShort = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return `${formatShort(start)} - ${formatShort(end)}`;
}
