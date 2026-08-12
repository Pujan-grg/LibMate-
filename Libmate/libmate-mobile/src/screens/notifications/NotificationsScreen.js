import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/users';

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen({ onClose }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getNotifications();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  async function handleMarkAllRead() {
    try { await markAllNotificationsRead(); } catch { /* ignore */ }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleMarkRead(id) {
    try { await markNotificationRead(id); } catch { /* ignore */ }
    setItems((prev) => prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2C1F14" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.readAll, unreadCount === 0 && { color: '#EAE0D0' }]}>Read all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#C4895A" />
        </View>
      ) : (
        <>
          {unreadCount > 0 && (
            <Text style={styles.unreadHint}>{unreadCount} unread</Text>
          )}

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="bell-off-outline" size={48} color="#D4C5B0" />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySub}>You're all caught up.</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {items.map((item, idx) => {
                  const timestamp = item.timestamp || formatTimestamp(item.created_at);
                  return (
                    <View key={item.notification_id}>
                      <TouchableOpacity
                        style={styles.notifRow}
                        onPress={() => handleMarkRead(item.notification_id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dotWrap}>
                          <View style={[styles.dot, item.is_read && styles.dotRead]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          {item.title && (
                            <Text style={[styles.notifTitle, item.is_read && styles.notifTitleRead]}>
                              {item.title}
                            </Text>
                          )}
                          <Text style={[styles.message, item.is_read && styles.messageRead]}>
                            {item.message}
                          </Text>
                          <Text style={styles.timestamp}>{timestamp}</Text>
                        </View>
                      </TouchableOpacity>
                      {idx < items.length - 1 && <View style={styles.rowDivider} />}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title:   { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#2C1F14' },
  readAll: { fontSize: 14, fontWeight: '600', color: '#C4895A', flexShrink: 0 },
  divider: { height: 1, backgroundColor: '#EAE0D0' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  unreadHint: {
    fontSize: 12, color: '#9A8478', fontWeight: '600',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },

  scroll: { padding: 16, paddingBottom: 32 },

  card: { backgroundColor: '#F3EDE3', borderRadius: 16, overflow: 'hidden' },

  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dotWrap:  { paddingTop: 5 },
  dot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C4895A' },
  dotRead:  { backgroundColor: '#D4C5B0' },

  notifTitle:     { fontSize: 13, fontWeight: '700', color: '#2C1F14', marginBottom: 2 },
  notifTitleRead: { fontWeight: '600', color: '#4A3728' },
  message:        { fontSize: 13, fontWeight: '500', color: '#4A3728', lineHeight: 19, marginBottom: 4 },
  messageRead:    { color: '#9A8478' },
  timestamp:      { fontSize: 11, color: '#9A8478' },

  rowDivider: { height: 1, backgroundColor: '#EAE0D0', marginHorizontal: 16 },

  empty:      { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3728', marginTop: 8 },
  emptySub:   { fontSize: 14, color: '#9A8478' },
});
