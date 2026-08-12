import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getBook, addReview } from '@/api/books';
import { getCoverUrl } from '@/api/client';
import { borrowBook } from '@/api/borrowings';
import { addToWishlist, removeFromWishlist, createReservation } from '@/api/users';
import useWishlistStore from '@/store/wishlistStore';

const PLACEHOLDER = require('../../../assets/icon.png');

function StarRating({ rating, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialCommunityIcons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#C4895A"
        />
      ))}
    </View>
  );
}

function StarPicker({ rating, onSelect }) {
  return (
    <View style={reviewModal.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onSelect(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons
            name={s <= rating ? 'star' : 'star-outline'}
            size={36}
            color="#C4895A"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewRow({ review }) {
  const name = review.full_name || review.reviewer_name || 'Reader';
  const date = new Date(review.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={styles.reviewerName}>{name}</Text>
          <Text style={styles.reviewDash}>—</Text>
          <StarRating rating={review.rating} />
        </View>
        <Text style={styles.reviewText}>{review.review_text}</Text>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
    </View>
  );
}

export default function BookDetailScreen({ book, onClose }) {
  const { isInWishlist, addBook, removeBook } = useWishlistStore();
  const [fullBook, setFullBook]               = useState(book);
  const [inWishlist, setInWishlist]           = useState(() => isInWishlist(book.book_id));
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [borrowLoading, setBorrowLoading]     = useState(false);
  const [borrowDone, setBorrowDone]           = useState(null); // null | 'borrowed' | 'waitlisted'
  const [reviews, setReviews]                 = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating]       = useState(5);
  const [reviewText, setReviewText]           = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const available = fullBook.available_copies > 0;

  useEffect(() => {
    async function loadDetails() {
      try {
        const { data } = await getBook(book.book_id);
        setFullBook((prev) => ({ ...prev, ...data.book }));
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
      } catch { /* keep empty */ }
    }
    loadDetails();
  }, [book.book_id]);

  async function handleWishlistToggle() {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(book.book_id);
        setInWishlist(false);
        removeBook(book.book_id);
      } else {
        await addToWishlist(book.book_id);
        setInWishlist(true);
        addBook(book.book_id);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not update wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleBorrowOrWaitlist() {
    if (borrowLoading || borrowDone) return;
    setBorrowLoading(true);
    try {
      if (available) {
        await borrowBook(book.book_id);
        setBorrowDone('borrowed');
        Alert.alert('Borrow Requested!', `"${fullBook.title}" is reserved for pickup. Collect it at the front desk within 48 hours.`);
      } else {
        await createReservation(book.book_id);
        setBorrowDone('waitlisted');
        Alert.alert('Added to Waitlist', `You've been added to the waitlist for "${fullBook.title}". We'll notify you when a copy becomes available.`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not complete request.';
      Alert.alert('Request Failed', msg);
    } finally {
      setBorrowLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewText.trim()) {
      Alert.alert('Missing Review', 'Please write something before submitting.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await addReview(book.book_id, { rating: reviewRating, review_text: reviewText.trim() });
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      Alert.alert('Review Submitted', 'Thank you for your feedback!');
      const { data } = await getBook(book.book_id);
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
    } catch (err) {
      Alert.alert('Cannot Submit', err.response?.data?.error || 'Something went wrong.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2C1F14" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Book Details</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.topDivider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image
            source={fullBook.cover_image ? { uri: getCoverUrl(fullBook.cover_image) } : PLACEHOLDER}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{fullBook.title}</Text>
            <Text style={styles.authorYear}>
              {fullBook.author}{fullBook.published_year ? ` · ${fullBook.published_year}` : ''}
            </Text>
            {fullBook.avg_rating > 0 && <StarRating rating={fullBook.avg_rating} />}
            <View style={styles.copiesRow}>
              <Text style={styles.copiesText}>{fullBook.available_copies}/{fullBook.total_copies} copies</Text>
              <View style={[styles.availDot, { backgroundColor: available ? '#4A7C59' : '#B85450' }]} />
            </View>
          </View>
        </View>
        <View style={styles.heroDivider} />

        {/* ── Reserve | Wishlist ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.reserveBtn, (borrowDone || borrowLoading) && styles.reserveBtnDone]}
            onPress={handleBorrowOrWaitlist}
            disabled={!!borrowDone || borrowLoading}
            activeOpacity={0.8}
          >
            {borrowLoading
              ? <ActivityIndicator size="small" color="#FAF7F2" />
              : <Text style={styles.reserveBtnText}>
                  {borrowDone === 'borrowed'   ? 'Borrow Requested ✓'
                  : borrowDone === 'waitlisted' ? 'On Waitlist ✓'
                  : available                   ? 'Borrow Book'
                  :                               'Join Waitlist'}
                </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.wishlistBtn, inWishlist && styles.wishlistBtnActive]}
            onPress={handleWishlistToggle}
            disabled={wishlistLoading}
            activeOpacity={0.8}
          >
            {wishlistLoading
              ? <ActivityIndicator size="small" color="#B85450" />
              : <Text style={[styles.wishlistBtnText, inWishlist && styles.wishlistBtnTextActive]}>
                  {inWishlist ? '♥ Saved' : '+ Wishlist'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Description ── */}
        <View style={styles.descCard}>
          <Text style={styles.cardTitle}>Description</Text>
          <View style={styles.descBox}>
            <Text style={styles.descText}>{fullBook.description}</Text>
          </View>
        </View>

        {/* ── Reviews ── */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Reviews</Text>
          {reviews.length > 0
            ? reviews.map((r, i) => (
                <View key={r.review_id}>
                  <ReviewRow review={r} />
                  {i < reviews.length - 1 && <View style={styles.reviewDivider} />}
                </View>
              ))
            : <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          }
        </View>

        {/* ── Write a Review ── */}
        <TouchableOpacity
          style={styles.writeReviewBtn}
          onPress={() => setShowReviewModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.writeReviewText}>Write a Review</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Write Review bottom sheet ── */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={reviewModal.overlay}>
            <TouchableOpacity style={reviewModal.backdrop} onPress={() => setShowReviewModal(false)} activeOpacity={1} />
            <View style={reviewModal.sheet}>
              <View style={reviewModal.handle} />
              <Text style={reviewModal.title}>Write a Review</Text>
              <Text style={reviewModal.subtitle}>{fullBook.title}</Text>
              <StarPicker rating={reviewRating} onSelect={setReviewRating} />
              <TextInput
                style={reviewModal.input}
                placeholder="Share your thoughts about this book..."
                placeholderTextColor="#9A8478"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[reviewModal.submitBtn, reviewSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitReview}
                disabled={reviewSubmitting}
                activeOpacity={0.85}
              >
                {reviewSubmitting
                  ? <ActivityIndicator color="#FAF7F2" />
                  : <Text style={reviewModal.submitText}>Submit Review</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={reviewModal.cancelBtn} onPress={() => setShowReviewModal(false)} activeOpacity={0.85}>
                <Text style={reviewModal.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAF7F2',
  },
  backBtn:      { padding: 4 },
  topBarTitle:  { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#2C1F14' },
  topDivider:   { height: 1, backgroundColor: '#EAE0D0' },

  content: { paddingBottom: 40 },

  hero:     { flexDirection: 'row', padding: 20, gap: 16, backgroundColor: '#FAF7F2' },
  cover:    { width: 110, height: 150, borderRadius: 10, backgroundColor: '#D4C5B0', flexShrink: 0 },
  heroInfo: { flex: 1, gap: 6, justifyContent: 'center' },
  title:    { fontSize: 16, fontWeight: '800', color: '#2C1F14', lineHeight: 22 },
  authorYear: { fontSize: 13, color: '#9A8478' },
  copiesRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  copiesText: { fontSize: 14, fontWeight: '700', color: '#2C1F14' },
  availDot:   { width: 8, height: 8, borderRadius: 4 },
  heroDivider:{ height: 1, backgroundColor: '#EAE0D0', marginHorizontal: 16 },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  reserveBtn: {
    flex: 1, backgroundColor: '#2C1F14', borderRadius: 10,
    paddingVertical: 14,
  },
  btnDisabled:     { opacity: 0.5 },
  reserveBtnDone:  { backgroundColor: '#4A7C59' },
  reserveBtnText:  { fontSize: 14, fontWeight: '700', color: '#FAF7F2', textAlign: 'center' },
  wishlistBtn: {
    flex: 1, backgroundColor: '#F3EDE3', borderRadius: 10,
    paddingVertical: 14,
  },
  wishlistBtnActive:     { backgroundColor: '#FADADD' },
  wishlistBtnText:       { fontSize: 14, fontWeight: '700', color: '#2C1F14', textAlign: 'center' },
  wishlistBtnTextActive: { color: '#B85450' },

  descCard: {
    backgroundColor: '#F3EDE3', marginHorizontal: 16,
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginBottom: 10 },
  descBox:   { backgroundColor: '#EAE0D0', borderRadius: 8, padding: 12 },
  descText:  { fontSize: 13, color: '#4A3728', lineHeight: 20 },

  reviewsSection: { paddingHorizontal: 16, marginBottom: 16 },
  reviewsTitle:   { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginBottom: 14 },
  reviewRow:      { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAE0D0',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  reviewAvatarText: { fontWeight: '700', fontSize: 15, color: '#4A3728' },
  reviewerName:     { fontSize: 13, fontWeight: '700', color: '#2C1F14' },
  reviewDash:       { fontSize: 12, color: '#9A8478' },
  reviewText:       { fontSize: 13, color: '#4A3728', lineHeight: 19 },
  reviewDate:       { fontSize: 11, color: '#9A8478', marginTop: 3 },
  reviewDivider:    { height: 1, backgroundColor: '#EAE0D0' },
  noReviews:        { fontSize: 14, color: '#9A8478' },

  writeReviewBtn: {
    backgroundColor: '#F3EDE3', marginHorizontal: 16, borderRadius: 10,
    paddingVertical: 15, marginBottom: 8,
  },
  writeReviewText: { fontSize: 15, fontWeight: '600', color: '#2C1F14', textAlign: 'center' },
});

const reviewModal = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,31,20,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#EAE0D0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title:    { fontSize: 20, fontWeight: '800', color: '#2C1F14', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9A8478', marginBottom: 20 },
  starRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  input: {
    backgroundColor: '#F3EDE3', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#2C1F14', minHeight: 100,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#2C1F14', borderRadius: 14,
    paddingVertical: 16, marginBottom: 12,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FAF7F2', textAlign: 'center' },
  cancelBtn: {
    backgroundColor: '#EAE0D0', borderRadius: 14,
    paddingVertical: 16,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#4A3728', textAlign: 'center' },
});
