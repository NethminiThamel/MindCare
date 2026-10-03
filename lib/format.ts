import type { Appointment, Counselor, MoodEntry } from '../types';
import { moodOptions, type MoodKey } from '../constants/theme';

export function moodMeta(key: MoodKey) {
  return moodOptions.find((m) => m.key === key) ?? moodOptions[2];
}

export function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function counselorName(list: Counselor[], id: string) {
  return list.find((c) => c.id === id)?.name ?? 'Counselor';
}

export function upcoming(appts: Appointment[]) {
  return appts
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function past(appts: Appointment[]) {
  return appts
    .filter((a) => a.status !== 'upcoming')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function moodsByUser(moods: MoodEntry[], userId: string) {
  return moods
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function nextDays(count = 7) {
  const out: { date: string; label: string }[] = [];
  const start = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    out.push({
      date,
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

export const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
