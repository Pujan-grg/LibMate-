import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getMyWishlist } from '@/api/users';
import { getCoverUrl } from '@/api/client';
import useWishlistStore from '@/store/wishlistStore';
import BookDetailScreen from '@/screens/catalogue/BookDetailScreen';

const PLACEHOLDER = require('../../../assets/icon.png');
const CARD_W = (Dimensions.get('window').width - 48) / 2;

function WishCard({ book, onPress }) {
  const avail = book.available_copies > 0;
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
        <View style={[styles.availBadge, { backgroundColor: avail ? '#D7EDD9' : '#FADADD' }]}>
          <Text style={[styles.availText, { color: avail ? '#4A7C59' : '#B85450' }]}>
            {avail ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function WishlistScreen() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [wishlist, setWishlist]         = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const { setWishlist: storeSet }       = useWishlistStore();

  async function fetchWishlist() {
    try {
      const { data } = await getMyWishlist();
      if (Array.isArray(data)) {
        setWishlist(data);
        storeSet(data);
      }
    } catch { /* keep current state */ }
  }

  useFocusEffect(useCallback(() => { fetchWishlist(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }

  if (wishlist.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4895A" />}
        >
          <View style={styles.empty}>
            <MaterialCommunityIcons name="heart-outline" size={48} color="#D4C5B0" />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySub}>Browse books and tap the heart to save them here.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const rows = [];
  for (let i = 0; i < wishlist.length; i += 2) {
    rows.push(wishlist.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerSub}>{wishlist.length} saved</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4895A" />}
      >
        {rows.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((book) => (
              <WishCard key={book.book_id} book={book} onPress={() => setSelectedBook(book)} />
            ))}
            {row.length === 1 && <View style={{ width: CARD_W }} />}
          </View>
        ))}
        <Text style={styles.countText}>{wishlist.length} saved</Text>
      </ScrollView>

      <Modal
        visible={selectedBook !== null}
        animationType="slide"
        onRequestClose={() => setSelectedBook(null)}
      >
        {selectedBook && (
          <BookDetailScreen
            book={selectedBook}
            onClose={() => {
              setSelectedBook(null);
              fetchWishlist();
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#2C1F14' },
  headerSub:   { fontSize: 13, color: '#9A8478', flexShrink: 0 },
  countText:   { textAlign: 'center', fontSize: 12, color: '#9A8478', marginTop: 8 },

  grid:        { paddingHorizontal: 16, paddingBottom: 24 },
  emptyScroll: { flex: 1 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

  card:      { width: CARD_W, backgroundColor: '#F3EDE3', borderRadius: 14, overflow: 'hidden' },
  cardCover: { width: '100%', height: 155, backgroundColor: '#D4C5B0' },
  cardInfo:  { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  cardAuthor:{ fontSize: 12, color: '#9A8478', marginBottom: 8 },
  availBadge:{ alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  availText: { fontSize: 11, fontWeight: '600' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3728', marginTop: 16 },
  emptySub:   { fontSize: 14, color: '#9A8478', marginTop: 6, textAlign: 'center' },
});
