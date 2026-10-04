import type { CounselorAvailability } from '../types';

const weekdays: CounselorAvailability['days'][number]['day'][] = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

export function getAvailabilityTimes(
  availability: CounselorAvailability | undefined,
  date: string,
  durationMin: number
): string[] {
  if (!availability?.isAcceptingSessions || availability.recurringWeekly === false) return [];

  const selectedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(selectedDate.getTime()) || durationMin <= 0) return [];

  const selectedDay = availability.days.find(
    (day) => day.day === weekdays[selectedDate.getDay()] && day.enabled
  );
  if (!selectedDay) return [];

  const start = parseTime(selectedDay.start);
  const end = parseTime(selectedDay.end);
  if (start === null || end === null || end <= start) return [];

  const step = durationMin + Math.max(0, availability.bufferMin ?? 0);
  const times: string[] = [];
  for (let minutes = start; minutes + durationMin <= end; minutes += step) {
    const slot = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const slotDate = new Date(`${date}T${slot}:00`);
    if (slotDate.getTime() > Date.now()) times.push(slot);
  }
  return times;
}

function parseTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
