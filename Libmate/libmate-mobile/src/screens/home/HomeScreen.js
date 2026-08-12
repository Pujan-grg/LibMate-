import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import useAuthStore from '@/store/authStore';
import { getBooks } from '@/api/books';
import { getTrending, getNewArrivals } from '@/api/trending';
import { getRecommendations, hasRecommendations } from '@/api/recommendations';
import BookCard from '@/components/BookCard';
import { HorizontalSkeletonCard } from '@/components/SkeletonCard';
import BookDetailScreen from '@/screens/catalogue/BookDetailScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import RecommendedScreen from '@/screens/recommendations/RecommendedScreen';
import TrendingScreen from '@/screens/home/TrendingScreen';
import NewArrivalsScreen from '@/screens/home/NewArrivalsScreen';
import { getNotifications } from '@/api/users';
import { getCoverUrl } from '@/api/client';
import { MOCK_BOOKS } from '@/data/mockData';

const SEARCH_PLACEHOLDER = require('../../../assets/icon.png');

function dedupeBooks(books) {
  const seen = new Set();
  return books.filter((b) => {
    if (seen.has(b.book_id)) return false;
    seen.add(b.book_id);
    return true;
  });
}

function SearchModal({ visible, onClose, onSelectBook }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); return; }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [visible]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await getBooks({ search: query.trim(), per_page: 20 });
        setResults(data?.books || (Array.isArray(data) ? data : []));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FAF7F2' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={search.safe}>
          {/* ── Top bar ── */}
          <View style={search.topBar}>
            <View style={search.inputRow}>
              <MaterialCommunityIcons name="magnify" size={18} color="#9A8478" />
              <TextInput
                ref={inputRef}
                style={search.input}
                placeholder="Title, author, ISBN or genre…"
                placeholderTextColor="#9A8478"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
              />
              {loading && <ActivityIndicator size="small" color="#C4895A" />}
            </View>
            <TouchableOpacity onPress={onClose} style={search.cancelBtn}>
              <Text style={search.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={search.divider} />

          {/* ── Results ── */}
          <FlatList
            data={results}
            keyExtractor={(b, index) => `${b.book_id ?? index}-${index}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={search.list}
            renderItem={({ item }) => {
              const avail = item.available_copies > 0;
              return (
                <TouchableOpacity
                  style={search.resultRow}
                  onPress={() => { onClose(); onSelectBook(item); }}
                  activeOpacity={0.75}
                >
                  <Image
                    source={item.cover_image ? { uri: getCoverUrl(item.cover_image) } : SEARCH_PLACEHOLDER}
                    style={search.cover}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={search.title} numberOfLines={2}>{item.title}</Text>
                    <Text style={search.author} numberOfLines={1}>{item.author}</Text>
                    {item.genre ? <Text style={search.genre}>{item.genre}</Text> : null}
                    <View style={[search.badge, { backgroundColor: avail ? '#D7EDD9' : '#FADADD' }]}>
                      <Text style={[search.badgeText, { color: avail ? '#4A7C59' : '#B85450' }]}>
                        {avail ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D4C5B0" />
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={search.separator} />}
            ListEmptyComponent={
              query.trim() && !loading ? (
                <View style={search.empty}>
                  <MaterialCommunityIcons name="book-search" size={44} color="#D4C5B0" />
                  <Text style={search.emptyText}>No books found</Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HorizontalBookList({ books, loading, onPress }) {
  if (loading) {
    return (
      <FlatList
        horizontal
        data={[1, 2, 3, 4]}
        keyExtractor={(i) => String(i)}
        renderItem={() => <HorizontalSkeletonCard />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      />
    );
  }
  if (!books.length) return null;
  return (
    <FlatList
      horizontal
      data={books}
      keyExtractor={(b, index) => `${b.book_id ?? index}-${index}`}
      renderItem={({ item }) => (
        <BookCard book={item} horizontal onPress={() => onPress(item)} />
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hList}
    />
  );
}

function MembershipPill({ hasActiveMembership, membership }) {
  if (hasActiveMembership && membership?.card_number) {
    return (
      <View style={[styles.pill, styles.pillActive]}>
        <MaterialCommunityIcons name="card-account-details" size={13} color="#FAF7F2" />
        <Text style={styles.pillText}>Member · {membership.card_number}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.pillGuest]}>
      <MaterialCommunityIcons name="account-outline" size={13} color="#9A8478" />
      <Text style={[styles.pillText, { color: '#9A8478' }]}>Guest account</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user, membership, hasActiveMembership } = useAuthStore();
  const [selectedBook, setSelectedBook] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [showNewArrivals, setShowNewArrivals] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState({ trending: true, arrivals: true, recs: true });
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAll() {
    const results = await Promise.allSettled([
      getTrending(10),
      getNewArrivals(6),
      hasRecommendations().then((r) =>
        r.data?.has_recommendations ? getRecommendations(10) : Promise.resolve({ data: [] })
      ),
      getNotifications(),
    ]);

    setTrending(dedupeBooks(
      results[0].status === 'fulfilled'
        ? (results[0].value.data?.books || results[0].value.data || [])
        : MOCK_BOOKS.slice(0, 8)
    ));
    setNewArrivals(dedupeBooks(
      results[1].status === 'fulfilled'
        ? (results[1].value.data?.books || results[1].value.data || [])
        : MOCK_BOOKS.slice(4, 10)
    ));
    setRecommendations(dedupeBooks(
      results[2].status === 'fulfilled'
        ? (results[2].value.data?.books || results[2].value.data || [])
        : MOCK_BOOKS.slice(2, 8)
    ));
    if (results[3].status === 'fulfilled') {
      const notifs = results[3].value.data;
      const arr = Array.isArray(notifs) ? notifs : (notifs?.notifications || []);
      setUnreadCount(arr.filter((n) => !n.is_read).length);
    }
    setLoading({ trending: false, arrivals: false, recs: false });
  }

  useEffect(() => { fetchAll(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'Reader';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4895A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.name}>{firstName}</Text>
            <MembershipPill hasActiveMembership={hasActiveMembership} membership={membership} />
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => setShowNotifications(true)}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#2C1F14" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <TouchableOpacity style={styles.searchBar} onPress={() => setShowSearch(true)} activeOpacity={0.75}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9A8478" />
          <Text style={styles.searchPlaceholder}>Search books, authors, ISBN…</Text>
        </TouchableOpacity>

        {/* ── Trending ── */}
        <SectionHeader title="Trending Now" onSeeAll={() => setShowTrending(true)} />
        <HorizontalBookList books={trending} loading={loading.trending} onPress={setSelectedBook} />

        {/* ── New Arrivals ── */}
        <SectionHeader title="New Arrivals" onSeeAll={() => setShowNewArrivals(true)} />
        <HorizontalBookList books={newArrivals} loading={loading.arrivals} onPress={setSelectedBook} />

        {/* ── Recommended ── */}
        {(loading.recs || recommendations.length > 0) && (
          <>
            <SectionHeader title="Recommended for You" onSeeAll={() => setShowRecommended(true)} />
            <HorizontalBookList books={recommendations} loading={loading.recs} onPress={setSelectedBook} />
          </>
        )}
      </ScrollView>

      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectBook={(book) => { setShowSearch(false); setSelectedBook(book); }}
      />

      <Modal visible={selectedBook !== null} animationType="slide" onRequestClose={() => setSelectedBook(null)}>
        {selectedBook && <BookDetailScreen book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </Modal>

      <Modal visible={showNotifications} animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <NotificationsScreen onClose={() => setShowNotifications(false)} />
      </Modal>

      <Modal visible={showRecommended} animationType="slide" onRequestClose={() => setShowRecommended(false)}>
        <RecommendedScreen onClose={() => setShowRecommended(false)} />
      </Modal>

      <Modal visible={showTrending} animationType="slide" onRequestClose={() => setShowTrending(false)}>
        <TrendingScreen onClose={() => setShowTrending(false)} />
      </Modal>

      <Modal visible={showNewArrivals} animationType="slide" onRequestClose={() => setShowNewArrivals(false)}>
        <NewArrivalsScreen onClose={() => setShowNewArrivals(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll:   { flex: 1 },
  content:  { paddingBottom: 32 },

  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  name:    { fontSize: 22, fontWeight: '800', color: '#2C1F14' },

  bannerLeft: { flex: 1, gap: 8 },
  bellBtn:    { position: 'relative', padding: 4, alignSelf: 'flex-start' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillActive: { backgroundColor: '#2C1F14' },
  pillGuest:  { backgroundColor: '#EAE0D0' },
  pillText:   { fontSize: 11, fontWeight: '600', color: '#FAF7F2' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAE0D0',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  searchPlaceholder: { fontSize: 14, color: '#9A8478' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#2C1F14' },
  seeAll:       { fontSize: 13, color: '#C4895A', fontWeight: '600', flexShrink: 0 },

  hList: { paddingHorizontal: 20 },
});

const search = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#FAF7F2' },
  topBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  inputRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EAE0D0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  input:      { flex: 1, fontSize: 15, color: '#2C1F14' },
  cancelBtn:  { paddingVertical: 4 },
  cancelText: { fontSize: 15, color: '#C4895A', fontWeight: '600' },
  divider:    { height: 1, backgroundColor: '#EAE0D0' },

  list: { padding: 16, gap: 4 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F3EDE3', borderRadius: 12, padding: 12,
  },
  cover:     { width: 52, height: 70, borderRadius: 8, backgroundColor: '#D4C5B0', flexShrink: 0 },
  title:     { fontSize: 14, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  author:    { fontSize: 12, color: '#9A8478', marginBottom: 2 },
  genre:     { fontSize: 11, color: '#C4895A', marginBottom: 6 },
  badge:     { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  separator: { height: 8 },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9A8478', fontWeight: '600' },
});
