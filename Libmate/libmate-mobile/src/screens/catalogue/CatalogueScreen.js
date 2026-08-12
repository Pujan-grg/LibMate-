import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MOCK_BOOKS, MOCK_GENRES } from '@/data/mockData';
import { getBooks, getGenres, requestBook } from '@/api/books';
import { getCoverUrl } from '@/api/client';
import BookDetailScreen from '@/screens/catalogue/BookDetailScreen';

const PLACEHOLDER = require('../../../assets/icon.png');
const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

function BookGridCard({ book, onPress }) {
  const available = book.available_copies > 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={book.cover_image ? { uri: getCoverUrl(book.cover_image) } : PLACEHOLDER}
        style={styles.cardCover}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.cardAuthor} numberOfLines={1}>{book.author}</Text>
        <View style={[styles.availBadge, { backgroundColor: available ? '#D7EDD9' : '#FADADD' }]}>
          <Text style={[styles.availText, { color: available ? '#4A7C59' : '#B85450' }]}>
            {available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RequestBookModal({ visible, onClose }) {
  const [title, setTitle]   = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes]   = useState('');
  const [loading, setLoading] = useState(false);

  function reset() { setTitle(''); setAuthor(''); setNotes(''); }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter the book title.');
      return;
    }
    setLoading(true);
    try {
      await requestBook({ title: title.trim(), author: author.trim() || undefined, notes: notes.trim() || undefined });
      Alert.alert('Request Submitted', 'Your book request has been sent to the library. We\'ll notify you if it\'s added.');
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.error || 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={reqModal.overlay}>
          <TouchableOpacity style={reqModal.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={reqModal.sheet}>
            <View style={reqModal.handle} />
            <Text style={reqModal.title}>Request a Book</Text>
            <Text style={reqModal.subtitle}>Can't find what you're looking for? Let us know.</Text>

            <Text style={reqModal.label}>Book Title *</Text>
            <TextInput
              style={reqModal.input}
              placeholder="e.g. Atomic Habits"
              placeholderTextColor="#9A8478"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
            <Text style={reqModal.label}>Author (optional)</Text>
            <TextInput
              style={reqModal.input}
              placeholder="e.g. James Clear"
              placeholderTextColor="#9A8478"
              value={author}
              onChangeText={setAuthor}
              returnKeyType="next"
            />
            <Text style={reqModal.label}>Notes (optional)</Text>
            <TextInput
              style={[reqModal.input, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="Edition, ISBN, reason for request…"
              placeholderTextColor="#9A8478"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={[reqModal.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FAF7F2" />
                : <Text style={reqModal.submitText}>Submit Request</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={reqModal.cancelBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={reqModal.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CatalogueScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [genres, setGenres] = useState(MOCK_GENRES);

  useEffect(() => {
    async function fetchCatalogue() {
      const [booksRes, genresRes] = await Promise.allSettled([
        getBooks({ per_page: 100 }),
        getGenres(),
      ]);
      if (booksRes.status === 'fulfilled') {
        const d = booksRes.value.data;
        setBooks(d?.books || (Array.isArray(d) ? d : MOCK_BOOKS));
      }
      if (genresRes.status === 'fulfilled') {
        const d = genresRes.value.data;
        setGenres(['All', ...(Array.isArray(d) ? d : MOCK_GENRES.slice(1))]);
      }
    }
    fetchCatalogue();
  }, []);

  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedGenre !== 'All') {
      result = result.filter((b) => b.genre === selectedGenre);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.includes(q)) ||
          (b.genre && b.genre.toLowerCase().includes(q))
      );
    }
    return result;
  }, [books, searchQuery, selectedGenre]);

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Books</Text>
        <TouchableOpacity style={styles.requestBtn} onPress={() => setShowRequestModal(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={15} color="#FAF7F2" />
          <Text style={styles.requestBtnText}>Request</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={18} color="#9A8478" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Title, author, ISBN or genre..."
          placeholderTextColor="#9A8478"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.divider} />

      {/* ── Genre chips — uses live `genres` state (fixed) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {genres.map((genre) => {
          const isActive = genre === selectedGenre;
          return (
            <TouchableOpacity
              key={genre}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedGenre(genre)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {genre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.divider} />

      {/* ── 2-column book grid ── */}
      <FlatList
        key="grid-2col"
        data={filteredBooks}
        keyExtractor={(item) => String(item.book_id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BookGridCard book={item} onPress={() => setSelectedBook(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="book-search" size={48} color="#D4C5B0" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySub}>Try a different search or genre</Text>
          </View>
        }
      />

      <Modal
        visible={selectedBook !== null}
        animationType="slide"
        onRequestClose={() => setSelectedBook(null)}
      >
        {selectedBook && (
          <BookDetailScreen
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </Modal>

      <RequestBookModal visible={showRequestModal} onClose={() => setShowRequestModal(false)} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C1F14' },
  requestBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2C1F14', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  requestBtnText: { fontSize: 13, fontWeight: '700', color: '#FAF7F2' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#EAE0D0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#2C1F14' },

  divider: { height: 1, backgroundColor: '#EAE0D0' },

  chipsScroll: { flexGrow: 0, height: 50 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, alignItems: 'flex-start' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#EAE0D0',
  },
  chipActive: { backgroundColor: '#2C1F14' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#2C1F14' },
  chipTextActive: { color: '#FAF7F2' },

  grid: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  card: { width: CARD_WIDTH, backgroundColor: '#F3EDE3', borderRadius: 14, overflow: 'hidden' },
  cardCover: { width: '100%', height: 155, backgroundColor: '#D4C5B0' },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  cardAuthor: { fontSize: 12, color: '#9A8478', marginBottom: 8 },
  availBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  availText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3728', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#9A8478', marginTop: 6 },
});

const reqModal = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,31,20,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
  },
  handle:   { width: 40, height: 4, backgroundColor: '#EAE0D0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', color: '#2C1F14', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9A8478', marginBottom: 20 },
  label:    { fontSize: 13, fontWeight: '600', color: '#4A3728', marginBottom: 6 },
  input: {
    backgroundColor: '#F3EDE3', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#2C1F14', marginBottom: 14,
  },
  submitBtn: { backgroundColor: '#2C1F14', borderRadius: 14, paddingVertical: 16, marginBottom: 12 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FAF7F2', textAlign: 'center' },
  cancelBtn: { backgroundColor: '#EAE0D0', borderRadius: 14, paddingVertical: 16 },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#4A3728', textAlign: 'center' },
});
