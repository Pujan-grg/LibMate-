import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getAllTrending } from '@/api/trending';
import { getCoverUrl } from '@/api/client';
import BookDetailScreen from '@/screens/catalogue/BookDetailScreen';

const PLACEHOLDER = require('../../../assets/icon.png');

function BookRow({ book, onPress }) {
  const avail = book.available_copies > 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={book.cover_image ? { uri: getCoverUrl(book.cover_image) } : PLACEHOLDER}
        style={styles.cover}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        {book.genre ? <Text style={styles.genre}>{book.genre}</Text> : null}
        <View style={[styles.badge, { backgroundColor: avail ? '#D7EDD9' : '#FADADD' }]}>
          <Text style={[styles.badgeText, { color: avail ? '#4A7C59' : '#B85450' }]}>
            {avail ? `${book.available_copies} available` : 'Unavailable'}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#D4C5B0" />
    </TouchableOpacity>
  );
}

export default function TrendingScreen({ onClose }) {
  const [books, setBooks]           = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  async function fetchPage(pageNum, replace = false) {
    try {
      const { data } = await getAllTrending(pageNum, 20);
      const incoming = data.books || [];
      setBooks((prev) => replace ? incoming : [...prev, ...incoming]);
      setTotalPages(data.total_pages || 1);
      setPage(pageNum);
    } catch { /* keep existing */ }
  }

  useEffect(() => {
    fetchPage(1, true).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPage(page + 1);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2C1F14" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Trending Now</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.divider} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#C4895A" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => String(b.book_id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookRow book={item} onPress={() => setSelectedBook(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#C4895A" style={{ marginVertical: 16 }} /> : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={selectedBook !== null} animationType="slide" onRequestClose={() => setSelectedBook(null)}>
        {selectedBook && <BookDetailScreen book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:     { padding: 4 },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#2C1F14' },
  divider:     { height: 1, backgroundColor: '#EAE0D0' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  list: { padding: 16 },

  row: {
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
});
