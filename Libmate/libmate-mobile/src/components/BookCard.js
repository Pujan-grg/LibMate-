import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

// Using built-in Image (not expo-image) for New Architecture compatibility.
// expo-image v55 conflicts with Expo SDK 54 on Android.
const PLACEHOLDER = require('../../assets/icon.png');
import { getCoverUrl } from '@/api/client';

export default function BookCard({ book, onPress, horizontal = false }) {
  const available = book.available_copies > 0;

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.8}>
        <Image
          source={book.cover_image ? { uri: getCoverUrl(book.cover_image) } : PLACEHOLDER}
          style={styles.hCover}
          resizeMode="cover"
        />
        <View style={styles.hInfo}>
          <Text style={styles.hTitle} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.hAuthor} numberOfLines={1} ellipsizeMode="tail">{book.author}</Text>
          <View style={[styles.hAvailBadge, { backgroundColor: available ? '#D7EDD9' : '#FADADD' }]}>
            <Text style={[styles.hAvailText, { color: available ? '#4A7C59' : '#B85450' }]}>
              {available ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid card for catalogue
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={book.cover_image ? { uri: getCoverUrl(book.cover_image) } : PLACEHOLDER}
        style={styles.cover}
        resizeMode="cover"
      />
      <View style={styles.badge}>
        <View style={[styles.availBadge, { backgroundColor: available ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.availText}>{available ? 'Available' : 'Unavailable'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        {book.genre ? (
          <View style={styles.genrePill}>
            <Text style={styles.genreText}>{book.genre}</Text>
          </View>
        ) : null}
        {book.avg_rating > 0 ? (
          <Text style={styles.rating}>★ {book.avg_rating.toFixed(1)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

const styles = StyleSheet.create({
  // Grid card
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 160, backgroundColor: '#F3F4F6' },
  badge: { position: 'absolute', top: 8, right: 8 },
  availBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  info: { padding: 10 },
  title: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  author: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  genrePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  genreText: { fontSize: 10, color: '#4F46E5', fontWeight: '600' },
  rating: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },

  // Horizontal card
  hCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#F3EDE3',
    borderRadius: 14,
    overflow: 'hidden',
  },
  hCover: { width: '100%', height: 180, backgroundColor: '#D4C5B0' },
  hInfo: { padding: 10 },
  hTitle: { fontSize: 12, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  hAuthor: { fontSize: 11, color: '#9A8478', marginBottom: 8 },
  hAvailBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  hAvailText: { fontSize: 11, fontWeight: '600' },
});
