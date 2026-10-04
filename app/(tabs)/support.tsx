import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import type { Counselor } from '../../types';

const filters = ['All', 'Anxiety & Stress', 'CBT', 'Relationships'] as const;
type CounselorFilter = (typeof filters)[number];

export default function Support() {
  const { currentUser, state } = useApp();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [filter, setFilter] = useState<CounselorFilter>('All');
  const [query, setQuery] = useState(q ?? '');
  const counselors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return state.counselors.filter((counselor) => {
      const searchableText = [counselor.name, counselor.title, counselor.bio, ...counselor.specialties]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const specialties = counselor.specialties.join(' ').toLowerCase();
      const matchesFilter = filter === 'All' || (
        filter === 'Anxiety & Stress'
          ? /anxiety|stress|panic|trauma/.test(specialties)
          : filter === 'CBT'
            ? /cbt|cognitive behavioral/.test(searchableText)
            : /relationship|couple/.test(specialties)
      );
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, state.counselors]);

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/(tabs)')} style={styles.back} accessibilityRole="button">
            <Ionicons name="chevron-back" size={16} color={colors.tealDark} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={currentUser?.name ?? 'Student'} color={currentUser?.avatarColor ?? colors.teal} size={30} />
          </Pressable>
        </View>

        <Text style={styles.title}>Find Support</Text>
        <Text style={styles.subtitle}>Talk with verified mental health experts</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.tealDark} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search specialties or counselor names..."
            placeholderTextColor="#9AAEA8"
            style={styles.searchInput}
            accessibilityLabel="Search counselors and specialties"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={17} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((option) => {
            const selected = filter === option;
            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.results}>
          {counselors.map((counselor) => (
            <CounselorRow key={counselor.id} counselor={counselor} />
          ))}
          {counselors.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={22} color={colors.muted} />
              <Text style={styles.emptyTitle}>No counselors found</Text>
              <Text style={styles.emptyText}>Try another name or specialty.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function CounselorRow({ counselor }: { counselor: Counselor }) {
  return (
    <Pressable
      onPress={() => router.push(`/counselor-details/${counselor.id}`)}
      style={({ pressed }) => [styles.counselorCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${counselor.name}, ${counselor.specialties.slice(0, 2).join(', ')}`}
    >
      <Avatar name={counselor.name} color={counselor.avatarColor} size={44} />
      <View style={styles.counselorInfo}>
        <Text style={styles.name} numberOfLines={1}>{counselor.name}</Text>
        <Text style={styles.specialties} numberOfLines={2}>{counselor.specialties.join(', ')}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color="#D9A83E" />
          <Text style={styles.rating}>{counselor.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.availability}>
        <Text style={styles.availabilityText}>View profile</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  backText: { color: colors.tealDark, fontSize: 14 },
  title: { color: '#397E72', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#657873', fontSize: 13, marginTop: 4, marginBottom: 13 },
  searchBox: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#B8C9C4',
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 7, color: colors.text, fontSize: 13 },
  filters: { alignItems: 'center', gap: 6, paddingTop: 9, paddingBottom: 11 },
  filterChip: {
    minHeight: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  filterChipSelected: { borderColor: colors.teal, backgroundColor: '#56B7A8' },
  filterText: { color: '#6E817C', fontSize: 12 },
  filterTextSelected: { color: colors.white, fontWeight: '600' },
  results: { gap: 8 },
  counselorCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5EEEB',
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: '#183C34',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { opacity: 0.78 },
  counselorInfo: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: '#397E72', fontSize: 14, fontWeight: '700' },
  specialties: { color: '#7B8D88', fontSize: 12, lineHeight: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: '#397E72', fontSize: 12, fontWeight: '600' },
  availability: { maxWidth: 86, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 9, backgroundColor: '#E8F5F1' },
  availabilityText: { color: '#4C8E7E', fontSize: 11, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 7 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 13 },
});