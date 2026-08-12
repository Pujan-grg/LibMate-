import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getMyBorrowings, getMyHistory, getMyWishlist, getMyReservations, cancelReservation } from '@/api/users';
import { getCoverUrl } from '@/api/client';
import { requestRenewal } from '@/api/borrowings';
import BookDetailScreen from '@/screens/catalogue/BookDetailScreen';

const PLACEHOLDER = require('../../../assets/icon.png');
const TABS = ['Borrowing', 'Reserved', 'Wishlist', 'History'];
const MAX_RENEWALS = 3;

// Flask 2.x serialises naive (local-time) datetimes as RFC 1123 with a "GMT"
// label, e.g. "Wed, 13 May 2026 09:43:00 GMT", even though the value is
// actually Nepal local time.  new Date() on any engine parses RFC 1123
// correctly, but treats it as UTC — 5 h 45 min ahead of reality.
// Fix: extract the UTC components (which are really local-time values) and
// re-stamp them as device-local time using the multi-arg Date constructor,
// which always creates a local-time date on every JS engine.
function parseLocalDate(str) {
  if (!str) return new Date(NaN);
  const d = new Date(str);
  if (isNaN(d.getTime())) return new Date(NaN);
  return new Date(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });
}

// ── Renew Book bottom-sheet modal ─────────────────────────────────
function RenewModal({ item, onClose, onRefresh }) {
  if (!item) return null;
  const isOverdue = item.status === 'overdue';
  const dueDate = parseLocalDate(item.due_date);
  const newDueDate = new Date(dueDate);
  newDueDate.setDate(newDueDate.getDate() + 14);

  async function handleConfirm() {
    try {
      await requestRenewal(item.borrow_id);
      onRefresh?.();
    } catch { /* ignore */ }
    onClose();
    Alert.alert(
      isOverdue ? 'Fine & Renewal' : 'Renewal Confirmed',
      isOverdue
        ? `Please pay the £${item.fine_amount?.toFixed(2)} fine at the front desk. Your renewal request has been submitted.`
        : `"${item.title}" has been renewed. New due date: ${formatDate(newDueDate.toISOString())}.`
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={renewStyles.overlay}>
        <TouchableOpacity style={renewStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={renewStyles.sheet}>
          <View style={renewStyles.handle} />
          <Text style={renewStyles.title}>{isOverdue ? 'Pay Fine & Renew' : 'Renew Book'}</Text>
          <Text style={renewStyles.subtitle}>{item.title} – {item.author}</Text>

          <View style={renewStyles.infoBlock}>
            <View style={renewStyles.infoRow}>
              <Text style={renewStyles.infoLabel}>Renewals Used</Text>
              <Text style={renewStyles.infoValue}>{item.renewal_count}/{MAX_RENEWALS}</Text>
            </View>
            {isOverdue && (
              <>
                <View style={renewStyles.rowDivider} />
                <View style={renewStyles.infoRow}>
                  <Text style={[renewStyles.infoLabel, { color: '#B85450' }]}>Outstanding Fine</Text>
                  <Text style={[renewStyles.infoValue, { color: '#B85450' }]}>
                    £{item.fine_amount?.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
            <View style={renewStyles.rowDivider} />
            <View style={renewStyles.infoRow}>
              <Text style={renewStyles.infoLabel}>New Due Date</Text>
              <Text style={renewStyles.infoValue}>{formatDate(newDueDate.toISOString())}</Text>
            </View>
          </View>

          <TouchableOpacity style={renewStyles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={renewStyles.confirmText}>
              {isOverdue ? 'Pay Fine & Confirm Renewal' : 'Confirm Renewal'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={renewStyles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={renewStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BorrowCard({ item, onRenew, onPress }) {
  const isOverdue = item.status === 'overdue';
  const canRenew = item.renewal_count < MAX_RENEWALS;
  const daysLeft = Math.ceil((parseLocalDate(item.due_date) - new Date()) / 86400000);
  const renewalOpen = isOverdue || daysLeft <= 3;
  return (
    <View style={styles.borrowCard}>
      <TouchableOpacity style={styles.borrowCardInner} onPress={onPress} activeOpacity={0.75}>
        <Image
          source={item.cover_image ? { uri: getCoverUrl(item.cover_image) } : PLACEHOLDER}
          style={styles.borrowCover}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.borrowTitle}>{item.title}</Text>
          <Text style={styles.borrowAuthor}>{item.author}</Text>
          <Text style={styles.borrowDates}>Issued: {formatShortDate(item.issued_date)}</Text>
          <Text style={[styles.borrowDates, isOverdue && styles.overdueText]}>
            Due: {formatShortDate(item.due_date)}{isOverdue ? ' · OVERDUE' : ''}
          </Text>
        </View>
      </TouchableOpacity>
      {renewalOpen ? (
        <TouchableOpacity
          style={[styles.renewBtn, isOverdue && styles.fineBtn, !canRenew && styles.renewBtnDisabled]}
          onPress={onRenew}
          disabled={!canRenew}
          activeOpacity={0.8}
        >
          <Text style={styles.renewBtnText}>
            {!canRenew ? 'Max Renewals Reached' : isOverdue ? 'Pay Fine & Renew' : 'Request Renewal'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.renewalNotice}>
          <Text style={styles.renewalNoticeText}>
            Renewal opens in {daysLeft - 3} day{daysLeft - 3 !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

function HistoryCard({ item, onPress }) {
  return (
    <View style={styles.borrowCard}>
      <TouchableOpacity style={styles.borrowCardInner} onPress={onPress} activeOpacity={0.75}>
        <Image
          source={item.cover_image ? { uri: getCoverUrl(item.cover_image) } : PLACEHOLDER}
          style={styles.borrowCover}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.borrowTitle}>{item.title}</Text>
          <Text style={styles.borrowAuthor}>{item.author}</Text>
          <Text style={styles.borrowDates}>Issued: {formatDate(item.issued_date)}</Text>
          <Text style={styles.borrowDates}>Returned: {formatDate(item.returned_date)}</Text>
          {item.fine_status === 'paid' && (
            <View style={[styles.copyBadge, { backgroundColor: '#FEF3C7', marginTop: 4 }]}>
              <Text style={[styles.copyBadgeText, { color: '#92400E' }]}>Fine paid</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ReservationCard({ item, onCancel, cancelling, onPress }) {
  const expiresAt = parseLocalDate(item.expires_at);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.round((expiresAt - now) / 3600000));
  return (
    <View style={styles.borrowCard}>
      <TouchableOpacity style={styles.borrowCardInner} onPress={onPress} activeOpacity={0.75}>
        <Image
          source={item.cover_image ? { uri: getCoverUrl(item.cover_image) } : PLACEHOLDER}
          style={styles.borrowCover}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.borrowTitle}>{item.title}</Text>
          <Text style={styles.borrowAuthor}>{item.author}</Text>
          <Text style={styles.borrowDates}>Reserved: {formatDate(item.reserved_at)}</Text>
          <View style={[styles.copyBadge, { backgroundColor: hoursLeft > 0 ? '#FEF3C7' : '#FADADD', marginTop: 4 }]}>
            <Text style={[styles.copyBadgeText, { color: hoursLeft > 0 ? '#92400E' : '#B85450' }]}>
              {hoursLeft > 0 ? `Collect within ${hoursLeft}h` : 'Reservation expired'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
        onPress={onCancel}
        disabled={cancelling}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel Reservation'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function WishlistCard({ book, onPress }) {
  const avail = book.available_copies > 0;
  return (
    <View style={styles.borrowCard}>
      <TouchableOpacity style={styles.borrowCardInner} onPress={onPress} activeOpacity={0.75}>
        <Image
          source={book.cover_image ? { uri: getCoverUrl(book.cover_image) } : PLACEHOLDER}
          style={styles.borrowCover}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.borrowTitle}>{book.title}</Text>
          <Text style={styles.borrowAuthor}>{book.author}</Text>
          <Text style={styles.borrowDates}>{book.genre}</Text>
          <View style={[styles.copyBadge, { backgroundColor: avail ? '#D7EDD9' : '#FADADD', marginTop: 4 }]}>
            <Text style={[styles.copyBadgeText, { color: avail ? '#4A7C59' : '#B85450' }]}>
              {avail ? `${book.available_copies} copies available` : 'Currently unavailable'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export default function MyBooksScreen() {
  const [activeTab, setActiveTab]         = useState('Borrowing');
  const [renewItem, setRenewItem]         = useState(null);
  const [selectedBook, setSelectedBook]   = useState(null);
  const [borrowings, setBorrowings]       = useState([]);
  const [history, setHistory]             = useState([]);
  const [wishlist, setWishlist]           = useState([]);
  const [reservations, setReservations]   = useState([]);
  const [cancellingId, setCancellingId]   = useState(null);
  const [refreshing, setRefreshing]       = useState(false);

  async function fetchData() {
    const [bRes, hRes, wRes, rRes] = await Promise.allSettled([
      getMyBorrowings(),
      getMyHistory(),
      getMyWishlist(),
      getMyReservations(),
    ]);
    if (bRes.status === 'fulfilled') {
      const d = bRes.value.data;
      setBorrowings(Array.isArray(d) ? d : []);
    }
    if (hRes.status === 'fulfilled') {
      const d = hRes.value.data;
      const arr = Array.isArray(d) ? d : (d?.history || []);
      setHistory(arr);
    }
    if (wRes.status === 'fulfilled') {
      const d = wRes.value.data;
      setWishlist(Array.isArray(d) ? d : []);
    }
    if (rRes.status === 'fulfilled') {
      const d = rRes.value.data;
      setReservations(Array.isArray(d) ? d : []);
    }
  }

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  function handleCancelReservation(item) {
    Alert.alert(
      'Cancel Reservation',
      `Cancel your reservation for "${item.title}"?`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(item.reservation_id);
            try {
              await cancelReservation(item.reservation_id);
              setReservations((prev) => prev.filter((r) => r.reservation_id !== item.reservation_id));
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'Could not cancel reservation.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'Borrowing':
        return borrowings.length > 0
          ? borrowings.map((item) => (
              <BorrowCard
                key={item.borrow_id}
                item={item}
                onRenew={() => setRenewItem(item)}
                onPress={() => setSelectedBook(item)}
              />
            ))
          : <EmptyState message="You have no active borrowings." />;
      case 'Reserved':
        return reservations.length > 0
          ? reservations.map((item) => (
              <ReservationCard
                key={item.reservation_id}
                item={item}
                onCancel={() => handleCancelReservation(item)}
                cancelling={cancellingId === item.reservation_id}
                onPress={() => setSelectedBook(item)}
              />
            ))
          : <EmptyState message="You have no reserved books." />;
      case 'Wishlist':
        return wishlist.length > 0
          ? wishlist.map((book) => (
              <WishlistCard key={book.book_id} book={book} onPress={() => setSelectedBook(book)} />
            ))
          : <EmptyState message="Your wishlist is empty." />;
      case 'History':
        return history.length > 0
          ? history.map((item) => (
              <HistoryCard key={item.borrow_id} item={item} onPress={() => setSelectedBook(item)} />
            ))
          : <EmptyState message="No borrowing history yet." />;
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Book Record</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabDivider} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
            tintColor="#C4895A"
            colors={['#C4895A']}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      <RenewModal item={renewItem} onClose={() => setRenewItem(null)} onRefresh={fetchData} />

      {selectedBook && (
        <Modal visible animationType="slide" onRequestClose={() => setSelectedBook(null)}>
          <BookDetailScreen book={selectedBook} onClose={() => setSelectedBook(null)} />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#FAF7F2' },
  header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C1F14' },

  tabBar:        { flexDirection: 'row', paddingHorizontal: 8, marginTop: 8 },
  tabBtn:        { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#9A8478' },
  tabTextActive: { color: '#2C1F14' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 8, right: 8,
    height: 2, backgroundColor: '#2C1F14', borderRadius: 1,
  },
  tabDivider: { height: 1, backgroundColor: '#EAE0D0' },

  content: { padding: 16, gap: 12 },

  borrowCard:      { backgroundColor: '#F3EDE3', borderRadius: 14, padding: 14, gap: 12 },
  borrowCardInner: { flexDirection: 'row', gap: 12 },
  borrowCover:     { width: 60, height: 80, borderRadius: 8, backgroundColor: '#D4C5B0', flexShrink: 0 },
  borrowTitle:     { fontSize: 14, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  borrowAuthor:    { fontSize: 13, fontWeight: '600', color: '#4A3728', marginBottom: 4 },
  borrowDates:     { fontSize: 12, color: '#9A8478', lineHeight: 18 },
  overdueText:     { color: '#B85450', fontWeight: '600' },
  copyBadge:       { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  copyBadgeText:   { fontSize: 11, fontWeight: '600' },

  renewBtn:         { alignSelf: 'stretch', backgroundColor: '#2C1F14', borderRadius: 10, paddingVertical: 12 },
  fineBtn:          { backgroundColor: '#B85450' },
  renewBtnDisabled: { backgroundColor: '#9A8478' },
  renewBtnText:     { fontSize: 14, fontWeight: '700', color: '#FAF7F2', textAlign: 'center' },

  renewalNotice:     { alignItems: 'center', paddingVertical: 8 },
  renewalNoticeText: { fontSize: 12, color: '#9A8478', fontStyle: 'italic' },

  cancelBtn:         { alignSelf: 'stretch', backgroundColor: '#FADADD', borderRadius: 10, paddingVertical: 12 },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText:     { fontSize: 14, fontWeight: '700', color: '#B85450', textAlign: 'center' },

  empty:     { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 15, color: '#9A8478' },
});

const renewStyles = StyleSheet.create({
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
  subtitle: { fontSize: 14, color: '#9A8478', marginBottom: 24 },
  infoBlock: { backgroundColor: '#F3EDE3', borderRadius: 14, marginBottom: 24 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowDivider: { height: 1, backgroundColor: '#EAE0D0', marginHorizontal: 16 },
  infoLabel:  { flex: 1, fontSize: 14, color: '#4A3728', fontWeight: '500' },
  infoValue:  { fontSize: 14, fontWeight: '700', color: '#2C1F14', flexShrink: 0, textAlign: 'right' },
  confirmBtn: {
    alignSelf: 'stretch', backgroundColor: '#2C1F14', borderRadius: 14,
    paddingVertical: 16, marginBottom: 12,
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FAF7F2', textAlign: 'center' },
  cancelBtn: {
    alignSelf: 'stretch', backgroundColor: '#EAE0D0', borderRadius: 14,
    paddingVertical: 16,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#4A3728', textAlign: 'center' },
});
