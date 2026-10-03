import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { faqs } from '../../data/faq';

export default function Help() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedQuestion, setExpandedQuestion] = useState(faqs[0].q);
  const categories = ['All', ...new Set(faqs.map((item) => item.category))];
  const visibleFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return faqs.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = !query || `${item.q} ${item.a} ${item.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <Screen padded={false}>
      <View style={styles.page}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="chevron-back" size={17} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>Help Center</Text>
          <Text style={styles.subtitle}>Find answers and get support</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#899A95" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for help articles..."
            placeholderTextColor="#899A95"
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search help articles"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((category) => {
            const selected = category === activeCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.faqList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {visibleFaqs.length ? visibleFaqs.map((item) => {
            const expanded = expandedQuestion === item.q;
            return (
              <Card key={item.q} style={styles.faqCard}>
                <Pressable
                  onPress={() => setExpandedQuestion(expanded ? '' : item.q)}
                  style={styles.questionRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                >
                  <Ionicons name="help-circle-outline" size={18} color={colors.teal} />
                  <Text style={styles.question}>{item.q}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
                </Pressable>
                {expanded ? (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answer}>{item.a}</Text>
                    {item.category === 'Getting started' && item.q.includes('replacement') ? (
                      <View style={styles.safetyNote}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={colors.tealDark} />
                        <Text style={styles.safetyText}>For immediate danger, call local emergency services. U.S.: call or text 988.</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            );
          }) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="search-outline" size={25} color={colors.teal} />
              <Text style={styles.emptyTitle}>No matching articles</Text>
              <Text style={styles.emptyText}>Try another search or choose a different topic.</Text>
            </Card>
          )}

          <Pressable onPress={() => router.push('/inbox')} style={styles.supportCard} accessibilityRole="button">
            <View style={styles.supportIcon}><Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.tealDark} /></View>
            <View style={styles.supportCopy}>
              <Text style={styles.supportTitle}>Still need help?</Text>
              <Text style={styles.supportSub}>Open your messages to contact your counselor.</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 11, paddingTop: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 4 },
  backText: { color: colors.text, fontSize: 14 },
  heading: { paddingHorizontal: 16, marginTop: 2 },
  title: { color: '#397E72', fontSize: 25, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 3 },
  searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DDE7E2', borderRadius: 23, backgroundColor: colors.white },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 9, color: colors.text, fontSize: 15 },
  categoryList: { alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.white },
  categoryChipSelected: { borderColor: '#67AF9B', backgroundColor: '#E8F5F0' },
  categoryText: { color: colors.muted, fontSize: 13 },
  categoryTextSelected: { color: colors.tealDark, fontWeight: '700' },
  faqList: { gap: 9, paddingHorizontal: 16, paddingBottom: 22 },
  faqCard: { padding: 13, borderRadius: 14 },
  questionRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 },
  question: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  answerWrap: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  answer: { color: '#53615D', fontSize: 14, lineHeight: 19 },
  safetyNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: '#EEF3FF' },
  safetyText: { flex: 1, color: '#4A5A6D', fontSize: 13, lineHeight: 16 },
  emptyCard: { alignItems: 'center', gap: 7, paddingVertical: 25 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  supportCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.white },
  supportIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.mint },
  supportCopy: { flex: 1, gap: 3 },
  supportTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  supportSub: { color: colors.muted, fontSize: 13 },
});
