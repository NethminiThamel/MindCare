export const colors = {
  bg: '#F3FAF7',
  white: '#FFFFFF',
  card: '#FFFFFF',
  teal: '#1C9B84',
  tealDark: '#0E6A5C',
  tealMid: '#2AAB92',
  tealSoft: '#D8F3EC',
  mint: '#EAF7F3',
  text: '#16332E',
  muted: '#53645F',
  coral: '#F07178',
  coralSoft: '#FFE3E4',
  line: '#E3EEEA',
  border: '#E3EEEA',
  gold: '#F4B942',
  overlay: 'rgba(14, 106, 92, 0.45)',
};

export const moodOptions = [
  { key: 'great', label: 'Great', emoji: '😄' },
  { key: 'good', label: 'Good', emoji: '🙂' },
  { key: 'okay', label: 'Okay', emoji: '😐' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'stressed', label: 'Stressed', emoji: '😫' },
] as const;

export type MoodKey = (typeof moodOptions)[number]['key'];
