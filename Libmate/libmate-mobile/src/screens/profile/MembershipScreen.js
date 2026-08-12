import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import useAuthStore from '@/store/authStore';
import { applyForMembership, getMembershipStatus } from '@/api/users';
import { SERVER_BASE_URL } from '@/api/client';

const PLANS = [
  { months: 3,  label: '3 Months',  price: 'NPR 200',  best: false },
  { months: 6,  label: '6 Months',  price: 'NPR 500',  best: true  },
  { months: 12, label: '12 Months', price: 'NPR 900',  best: false },
];

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── No profile picture guard ─────────────────────────────────────────────────
function NoPictureView({ onGoToEdit, refreshProps }) {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...refreshProps} tintColor="#C4895A" colors={['#C4895A']} />}
    >
      <View style={styles.guardBox}>
        <MaterialCommunityIcons name="account-circle-outline" size={52} color="#C4895A" />
        <Text style={styles.guardTitle}>Profile Photo Required</Text>
        <Text style={styles.guardSub}>
          You need to upload a clear, front-facing profile photo before applying for membership.
          This photo will appear on your membership card.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={onGoToEdit} activeOpacity={0.85}>
          <Text style={styles.btnText}>Upload Profile Photo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Apply form ───────────────────────────────────────────────────────────────
function NoMembershipView({ onGoToEdit, refreshProps }) {
  const { user, setMembership } = useAuthStore();
  const [selected, setSelected]   = useState(6);
  const [receipt,  setReceipt]    = useState(null);
  const [loading,  setLoading]    = useState(false);

  const photoUrl = user?.profile_picture
    ? `${SERVER_BASE_URL}/uploads/photos/${user.profile_picture}`
    : null;

  async function pickReceipt() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setReceipt(result.assets[0]);
    }
  }

  function confirmAndSubmit() {
    if (!receipt) {
      Alert.alert('Receipt required', 'Please upload your payment receipt before submitting.');
      return;
    }
    Alert.alert(
      'Confirm Membership Request',
      'Your current profile photo will be used on your membership card.\n\nRequirements:\n• Clear, front-facing photo\n• Face clearly visible\n• Good lighting\n\nDo you want to proceed with this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: submitApplication },
      ]
    );
  }

  async function submitApplication() {
    setLoading(true);
    try {
      await applyForMembership(selected, receipt.uri);
      const res = await getMembershipStatus();
      const data = res.data;
      setMembership(data, data.status === 'active');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not submit application. Try again.';
      Alert.alert('Application Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...refreshProps} tintColor="#C4895A" colors={['#C4895A']} />}
    >

      {/* Duration */}
      <Text style={styles.sectionLabel}>SELECT DURATION</Text>
      <View style={styles.plansGrid}>
        {PLANS.map(plan => {
          const active = selected === plan.months;
          return (
            <TouchableOpacity
              key={plan.months}
              style={[
                styles.planCard,
                plan.months === 12 && styles.planCardFull,
                active && styles.planCardActive,
              ]}
              onPress={() => setSelected(plan.months)}
              activeOpacity={0.8}
            >
              <Text style={[styles.planLabel, active && styles.planLabelActive]}>{plan.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.planPrice, active && styles.planPriceActive]}>{plan.price}</Text>
                {plan.best && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestText}>Best value</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* QR Code */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SCAN TO PAY</Text>
      <View style={styles.qrBox}>
        <Image
          source={{ uri: `${SERVER_BASE_URL}/api/membership/qr-code` }}
          style={styles.qrImage}
          resizeMode="contain"
        />
        <Text style={styles.qrHint}>Scan this QR code with your payment app to complete the payment</Text>
      </View>

      {/* Receipt upload */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>UPLOAD PAYMENT RECEIPT</Text>
      <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt} activeOpacity={0.8}>
        <MaterialCommunityIcons name="upload" size={24} color="#9A8478" />
        <Text style={styles.receiptBtnText}>
          {receipt ? receipt.fileName || 'Receipt selected' : 'Tap to upload payment screenshot'}
        </Text>
        <Text style={styles.receiptHint}>PNG, JPG up to 5 MB</Text>
      </TouchableOpacity>
      {receipt && (
        <View style={styles.receiptConfirm}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#4A7C59" />
          <Text style={styles.receiptConfirmText}>Receipt selected</Text>
        </View>
      )}

      {/* Profile photo preview */}
      <View style={styles.photoBox}>
        <Text style={styles.photoBoxTitle}>Profile Photo for Membership Card</Text>
        <View style={styles.photoBoxRow}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoThumb} />
          ) : (
            <View style={[styles.photoThumb, styles.photoThumbPlaceholder]}>
              <MaterialCommunityIcons name="account" size={22} color="#9A8478" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.photoBoxSub}>This photo will appear on your membership card</Text>
            <View style={styles.reviewRow}>
              <MaterialCommunityIcons name="alert" size={14} color="#D97706" />
              <Text style={styles.reviewText}>Will be reviewed by the admin</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Your info */}
      <View style={styles.infoBox}>
        <Text style={styles.photoBoxTitle}>Your Information</Text>
        <Text style={styles.infoLine}><Text style={styles.infoKey}>Name: </Text>{user?.full_name || '—'}</Text>
        <Text style={styles.infoLine}><Text style={styles.infoKey}>Email: </Text>{user?.email || '—'}</Text>
        <Text style={styles.infoLine}><Text style={styles.infoKey}>Phone: </Text>{user?.phone || 'Not provided'}</Text>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        After payment, upload the receipt. Admin will review your application including your profile photo.
        If the photo doesn't meet requirements, your membership may be rejected.
      </Text>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.btn, (!receipt || loading) && styles.btnDisabled]}
        onPress={confirmAndSubmit}
        disabled={!receipt || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Submit Request</Text>}
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Pending ──────────────────────────────────────────────────────────────────
function PendingView({ refreshProps }) {
  const { membership } = useAuthStore();
  const plan = PLANS.find(p => p.months === membership?.duration_months);
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...refreshProps} tintColor="#C4895A" colors={['#C4895A']} />}
    >
      <View style={styles.pendingCard}>
        <MaterialCommunityIcons name="clock-outline" size={44} color="#D97706" />
        <Text style={styles.pendingTitle}>Application Pending</Text>
        <Text style={styles.pendingSub}>
          Your membership application is under review. Library staff will approve it shortly.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>APPLICATION DETAILS</Text>
        <InfoRow label="Plan duration" value={`${membership?.duration_months ?? '—'} months`} />
        <View style={styles.rowDivider} />
        <InfoRow label="Amount" value={plan?.price ?? '—'} />
        <View style={styles.rowDivider} />
        <InfoRow label="Payment" value={membership?.payment_status === 'paid' ? 'Receipt uploaded' : 'Pending payment'} />
        <View style={styles.rowDivider} />
        <InfoRow label="Status" value="Under review" />
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>WHAT HAPPENS NEXT</Text>
        {[
          'Library staff will review your application',
          'You will receive a notification when approved',
          'Visit the library desk if additional verification is needed',
        ].map((step, i) => (
          <View key={i} style={styles.benefitRow}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#D97706" />
            <Text style={styles.benefitText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Active ────────────────────────────────────────────────────────────────────
function ActiveView({ refreshProps }) {
  const { membership } = useAuthStore();
  const isActive = membership.status === 'active';

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...refreshProps} tintColor="#C4895A" colors={['#C4895A']} />}
    >
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardIconBox}>
            <MaterialCommunityIcons name="card-account-details" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>LibMate Library Card</Text>
            <Text style={styles.cardNumber}>{membership.card_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#D7EDD9' : '#FADADD' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#4A7C59' : '#B85450' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>MEMBERSHIP DETAILS</Text>
        <InfoRow label="Status"        value={isActive ? 'Active' : 'Inactive'} />
        <View style={styles.rowDivider} />
        <InfoRow label="Payment"       value={membership.payment_status === 'paid' ? 'Paid' : 'Pending'} />
        <View style={styles.rowDivider} />
        <InfoRow label="Plan duration" value={`${membership.duration_months} months`} />
        <View style={styles.rowDivider} />
        <InfoRow label="Expiry date"   value={formatDate(membership.expiry_date)} />
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>MEMBER BENEFITS</Text>
        {[
          'Borrow up to 5 books at a time',
          'Up to 2 renewals per book',
          'Priority reservation on new arrivals',
          'Access to digital reading resources',
        ].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#2C1F14" />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => Alert.alert('Renew Membership', 'Please visit the library desk to renew your membership.')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Renew Membership</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function MembershipScreen({ onGoToEdit }) {
  const { membership, user, setMembership } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const { data } = await getMembershipStatus();
      if (data?.status === 'none') {
        setMembership(null, false);
      } else {
        setMembership(data, data?.has_membership ?? false);
      }
    } catch { /* silent */ }
    setRefreshing(false);
  }

  const refreshProps = { refreshing, onRefresh };

  if (!membership) {
    if (!user?.profile_picture) return <NoPictureView onGoToEdit={onGoToEdit} refreshProps={refreshProps} />;
    return <NoMembershipView onGoToEdit={onGoToEdit} refreshProps={refreshProps} />;
  }
  if (membership.status === 'pending') return <PendingView refreshProps={refreshProps} />;
  return <ActiveView refreshProps={refreshProps} />;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },

  // ── No picture guard ──
  guardBox: {
    alignItems: 'center', gap: 12,
    paddingVertical: 32, paddingHorizontal: 20,
    backgroundColor: '#FFF8F0', borderRadius: 16,
    borderWidth: 1, borderColor: '#FDDCB5',
  },
  guardTitle: { fontSize: 18, fontWeight: '800', color: '#2C1F14', textAlign: 'center' },
  guardSub:   { fontSize: 14, color: '#9A8478', textAlign: 'center', lineHeight: 20 },

  // ── Plan grid ──
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9A8478',
    letterSpacing: 0.8, marginBottom: 10,
  },
  plansGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FAF7F2', borderRadius: 12,
    borderWidth: 2, borderColor: '#EAE0D0',
    padding: 14, gap: 4,
  },
  planCardFull:   { minWidth: '100%' },
  planCardActive: { borderColor: '#2C1F14', backgroundColor: '#F3EDE3' },
  planLabel:       { fontSize: 15, fontWeight: '700', color: '#4A3728' },
  planLabelActive: { color: '#2C1F14' },
  planPrice:       { fontSize: 13, color: '#9A8478', fontWeight: '600' },
  planPriceActive: { color: '#C4895A' },
  bestBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  bestText: { fontSize: 10, fontWeight: '700', color: '#92400E' },

  // ── QR ──
  qrBox: { alignItems: 'center', gap: 10 },
  qrImage: {
    width: 200, height: 200,
    borderRadius: 8,
  },
  qrHint: { fontSize: 12, color: '#9A8478', textAlign: 'center', lineHeight: 18 },

  // ── Receipt ──
  receiptBtn: {
    borderWidth: 1.5, borderColor: '#D4C5B0', borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 20, paddingHorizontal: 16,
    alignItems: 'center', gap: 6, backgroundColor: '#FAF7F2',
  },
  receiptBtnText: { fontSize: 14, color: '#4A3728', fontWeight: '600', textAlign: 'center' },
  receiptHint:    { fontSize: 11, color: '#9A8478' },
  receiptConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 4,
  },
  receiptConfirmText: { fontSize: 13, color: '#4A7C59', fontWeight: '600' },

  // ── Photo box ──
  photoBox: {
    marginTop: 20, backgroundColor: '#FAF7F2',
    borderRadius: 12, padding: 14, gap: 10,
    borderWidth: 1, borderColor: '#EAE0D0',
  },
  photoBoxTitle: { fontSize: 12, fontWeight: '700', color: '#C4895A' },
  photoBoxRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoThumb: {
    width: 52, height: 52, borderRadius: 26, overflow: 'hidden',
  },
  photoThumbPlaceholder: {
    backgroundColor: '#EAE0D0', justifyContent: 'center', alignItems: 'center',
  },
  photoBoxSub:  { fontSize: 13, color: '#4A3728', lineHeight: 18 },
  reviewRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reviewText:   { fontSize: 11, color: '#D97706', fontWeight: '600' },

  // ── Info box ──
  infoBox: {
    marginTop: 12, backgroundColor: '#FAF7F2',
    borderRadius: 12, padding: 14, gap: 4,
    borderWidth: 1, borderColor: '#EAE0D0',
  },
  infoLine: { fontSize: 13, color: '#4A3728', lineHeight: 20 },
  infoKey:  { fontWeight: '700', color: '#2C1F14' },

  // ── Disclaimer ──
  disclaimer: {
    fontSize: 12, color: '#9A8478', textAlign: 'center',
    lineHeight: 18, marginTop: 16, marginBottom: 4,
  },

  // ── Buttons ──
  btn: {
    alignSelf: 'stretch', backgroundColor: '#2C1F14', borderRadius: 12,
    paddingVertical: 15, marginTop: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },

  // ── Pending ──
  pendingCard: {
    alignItems: 'center', gap: 10,
    paddingVertical: 28, paddingHorizontal: 16,
    backgroundColor: '#FFFBEB', borderRadius: 16,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 20,
  },
  pendingTitle: { fontSize: 18, fontWeight: '800', color: '#92400E' },
  pendingSub:   { fontSize: 14, color: '#B45309', textAlign: 'center', lineHeight: 20 },

  // ── Active card ──
  card: { backgroundColor: '#2C1F14', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle:  { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  cardNumber: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  // ── Shared detail card ──
  detailCard: {
    backgroundColor: '#F3F4F6', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13,
  },
  infoLabel: { flex: 1, fontSize: 14, color: '#4A3728', fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#2C1F14', flexShrink: 0, textAlign: 'right' },
  rowDivider: { height: 1, backgroundColor: '#EAE0D0' },

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  benefitText: { fontSize: 14, color: '#4A3728', flex: 1 },
});
