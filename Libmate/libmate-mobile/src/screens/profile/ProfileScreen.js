import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVER_BASE_URL } from '@/api/client';

import useAuthStore from '@/store/authStore';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import MembershipScreen from '@/screens/profile/MembershipScreen';
import ChangePasswordScreen from '@/screens/auth/ChangePasswordScreen';

const MENU_ITEMS = [
  { key: 'EditProfile',    label: 'Edit Personal Details', icon: 'account-edit-outline',          iconColor: '#C4895A' },
  { key: 'ChangePassword', label: 'Change Password',       icon: 'lock-outline',                  iconColor: '#4A7C59' },
  { key: 'Membership',     label: 'My Membership',         icon: 'card-account-details-outline',   iconColor: '#2C1F14' },
  { key: 'HelpFaq',        label: 'Help & FAQ',            icon: 'help-circle-outline',            iconColor: '#9A8478' },
];

function ModalScreen({ title, onClose, children }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View style={modalStyles.topBar}>
        <TouchableOpacity onPress={onClose} style={modalStyles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2C1F14" />
        </TouchableOpacity>
        <Text style={modalStyles.topBarTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={{ height: 1, backgroundColor: '#EAE0D0' }} />
      {children}
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:     { padding: 4 },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#2C1F14' },
});

function LibraryCardWidget({ membership }) {
  if (!membership?.card_number) return null;
  const isActive = membership.status === 'active';
  return (
    <View style={styles.libCard}>
      <View style={styles.libCardLeft}>
        <MaterialCommunityIcons name="library" size={20} color="#C4895A" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.libCardLabel}>Library Card</Text>
          <Text style={styles.libCardNumber}>{membership.card_number}</Text>
        </View>
      </View>
      <View style={[styles.libCardBadge, { backgroundColor: isActive ? '#D7EDD9' : '#FADADD' }]}>
        <Text style={[styles.libCardBadgeText, { color: isActive ? '#4A7C59' : '#B85450' }]}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, membership, hasActiveMembership, clearAuth } = useAuthStore();
  const [openModal, setOpenModal] = useState(null);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const photoUrl = user?.profile_picture
    ? `${SERVER_BASE_URL}/uploads/photos/${user.profile_picture}`
    : null;

  function handleMenuPress(key) {
    if (key === 'HelpFaq') {
      Alert.alert('Help & FAQ', 'Help content coming soon.');
      return;
    }
    setOpenModal(key);
  }

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => clearAuth() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setOpenModal('EditProfile')} style={styles.editBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color="#C4895A" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Banner ── */}
        <View style={styles.banner}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <TouchableOpacity style={styles.avatarWrap} onPress={() => setOpenModal('EditProfile')} activeOpacity={0.85}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarCameraBtn}>
              <MaterialCommunityIcons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.full_name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>

          {hasActiveMembership ? (
            <View style={styles.memberBadge}>
              <MaterialCommunityIcons name="check-circle" size={13} color="#C4895A" />
              <Text style={styles.memberBadgeText}>Active Member</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.joinBadge} onPress={() => setOpenModal('Membership')}>
              <Text style={styles.joinBadgeText}>Join as a member →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Library card strip (members only) ── */}
        {membership && (
          <View style={styles.cardStripWrap}>
            <LibraryCardWidget membership={membership} />
          </View>
        )}

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, idx) => (
              <View key={item.key}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => handleMenuPress(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.iconColor + '1A' }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D4C5B0" />
                </TouchableOpacity>
                {idx < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── App info ── */}
        <Text style={styles.appVersion}>LibMate 2.0 · UWE Bristol</Text>

        {/* ── Log out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={18} color="#B85450" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Sub-screen Modals ── */}
      <Modal visible={openModal === 'EditProfile'} animationType="slide" onRequestClose={() => setOpenModal(null)}>
        <ModalScreen title="Edit Personal Details" onClose={() => setOpenModal(null)}>
          <EditProfileScreen onSuccess={() => setOpenModal(null)} />
        </ModalScreen>
      </Modal>

      <Modal visible={openModal === 'ChangePassword'} animationType="slide" onRequestClose={() => setOpenModal(null)}>
        <ModalScreen title="Change Password" onClose={() => setOpenModal(null)}>
          <ChangePasswordScreen onSuccess={() => setOpenModal(null)} />
        </ModalScreen>
      </Modal>

      <Modal visible={openModal === 'Membership'} animationType="slide" onRequestClose={() => setOpenModal(null)}>
        <ModalScreen title="My Membership" onClose={() => setOpenModal(null)}>
          <MembershipScreen onGoToEdit={() => { setOpenModal(null); setTimeout(() => setOpenModal('EditProfile'), 300); }} />
        </ModalScreen>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { paddingBottom: 40, alignItems: 'stretch' },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#2C1F14' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3EDE3', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    flexShrink: 0,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#C4895A', flexShrink: 0 },

  // ── Banner ──
  banner: {
    backgroundColor: '#2C1F14',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(196,137,90,0.12)', top: -40, right: -40,
  },
  decorCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(196,137,90,0.08)', bottom: -20, left: -20,
  },

  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: '#C4895A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, backgroundColor: '#3D2A1A',
    position: 'relative', overflow: 'visible',
  },
  avatarImg:  { width: 78, height: 78, borderRadius: 39 },
  avatar:     { width: 76, height: 76, borderRadius: 38, backgroundColor: '#4A3728', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FAF7F2' },
  avatarCameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#C4895A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#2C1F14',
  },

  name:  { fontSize: 20, fontWeight: '800', color: '#FAF7F2', marginBottom: 4 },
  email: { fontSize: 13, color: '#9A8478', marginBottom: 14 },

  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#C4895A',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  memberBadgeText: { fontSize: 12, fontWeight: '700', color: '#C4895A' },

  joinBadge: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(196,137,90,0.4)',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  joinBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(196,137,90,0.8)' },

  // ── Library card strip ──
  cardStripWrap: { marginHorizontal: 16, marginTop: 12 },
  libCard: {
    backgroundColor: '#F3EDE3',
    borderRadius: 14, borderWidth: 1, borderColor: '#EAE0D0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  libCardLeft:        { flex: 1, flexDirection: 'row', alignItems: 'center' },
  libCardLabel:       { fontSize: 11, color: '#9A8478', fontWeight: '600', letterSpacing: 0.5 },
  libCardNumber:      { fontSize: 15, fontWeight: '800', color: '#2C1F14', marginTop: 1 },
  libCardBadge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  libCardBadgeText:   { fontSize: 11, fontWeight: '700' },

  // ── Menu ──
  menuSection:      { marginHorizontal: 16, marginTop: 24 },
  menuSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9A8478', letterSpacing: 0.8, marginBottom: 10 },
  menuCard: {
    backgroundColor: '#F3EDE3',
    borderRadius: 16, borderWidth: 1, borderColor: '#EAE0D0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel:   { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C1F14' },
  menuDivider: { height: 1, backgroundColor: '#EAE0D0', marginHorizontal: 16 },

  appVersion: {
    textAlign: 'center', fontSize: 11, color: '#D4C5B0',
    marginTop: 28, marginBottom: 4,
  },

  logoutBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#B85450', flexShrink: 0 },
});
