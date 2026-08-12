import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import useAuthStore from '@/store/authStore';
import { updateProfile, uploadProfilePhoto, removeProfilePhoto } from '@/api/users';
import { SERVER_BASE_URL } from '@/api/client';

function Field({ label, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#9A8478"
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function EditProfileScreen({ onSuccess }) {
  const { user, token, membership, hasActiveMembership, setAuth, setUser } = useAuthStore();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
    address:   user?.address   || '',
  });
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const photoUrl = user?.profile_picture
    ? `${SERVER_BASE_URL}/uploads/photos/${user.profile_picture}`
    : null;

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }

  async function handlePhotoPress() {
    const options = [
      { text: 'Choose from Library', onPress: pickAndUpload },
      user?.profile_picture
        ? { text: 'Remove Photo', style: 'destructive', onPress: handleRemovePhoto }
        : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean);
    Alert.alert('Profile Photo', 'Choose an option', options);
  }

  async function pickAndUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    setPhotoLoading(true);
    try {
      const res = await uploadProfilePhoto(result.assets[0].uri);
      const filename = res.data.filename;
      setUser({ ...user, profile_picture: filename });
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleRemovePhoto() {
    setPhotoLoading(true);
    try {
      await removeProfilePhoto();
      setUser({ ...user, profile_picture: null });
    } catch {
      Alert.alert('Error', 'Could not remove photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({ full_name: form.full_name, phone: form.phone, address: form.address });
      setAuth(token, { ...user, ...form }, membership, hasActiveMembership);
      Alert.alert('Profile Updated', 'Your details have been saved.', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile photo ── */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={handlePhotoPress}
            activeOpacity={0.8}
            disabled={photoLoading}
          >
            {photoLoading ? (
              <View style={styles.avatarLoader}>
                <ActivityIndicator color="#C4895A" />
              </View>
            ) : photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <MaterialCommunityIcons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change profile photo</Text>
        </View>

        {/* ── Text fields ── */}
        <Field
          label="FULL NAME"
          placeholder="Jane Doe"
          value={form.full_name}
          onChangeText={(v) => setField('full_name', v)}
          error={errors.full_name}
          returnKeyType="next"
          autoCapitalize="words"
        />
        <Field
          label="EMAIL"
          placeholder="you@example.com"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          error={errors.email}
          returnKeyType="next"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />
        <Field
          label="PHONE (OPTIONAL)"
          placeholder="+977 98XXXXXXXX"
          value={form.phone}
          onChangeText={(v) => setField('phone', v)}
          returnKeyType="next"
          keyboardType="phone-pad"
        />
        <Field
          label="ADDRESS (OPTIONAL)"
          placeholder="Kathmandu, Nepal"
          value={form.address}
          onChangeText={(v) => setField('address', v)}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#FAF7F2" />
            : <Text style={styles.btnText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },

  // ── Photo section ──
  photoSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: '#C4895A',
    position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: '#4A3728', justifyContent: 'center', alignItems: 'center',
  },
  avatarLoader: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: '#EAE0D0', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FAF7F2' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#C4895A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FAF7F2',
  },
  photoHint: { fontSize: 12, color: '#9A8478', marginTop: 8 },

  // ── Fields ──
  field:      { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#9A8478', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#F3EDE3', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#2C1F14',
  },
  inputError: { borderWidth: 1.5, borderColor: '#B85450' },
  errorText:  { fontSize: 12, color: '#B85450', marginTop: 4 },

  btn: {
    alignSelf: 'stretch', backgroundColor: '#2C1F14',
    borderRadius: 12, paddingVertical: 15, marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FAF7F2', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
});
