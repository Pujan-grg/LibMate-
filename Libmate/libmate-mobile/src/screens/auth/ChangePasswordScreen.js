import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function PasswordField({ label, value, onChangeText, error, returnKeyType, onSubmitEditing }) {
  const [secure, setSecure] = useState(true);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholderTextColor="#9A8478"
          placeholder="••••••••"
          secureTextEntry={secure}
          value={value}
          onChangeText={onChangeText}
          returnKeyType={returnKeyType || 'next'}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setSecure((s) => !s)}>
          <MaterialCommunityIcons
            name={secure ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="#9A8478"
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function ChangePasswordScreen({ onSuccess }) {
  const [form, setForm]     = useState({ old_password: '', new_password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }

  function validate() {
    const e = {};
    if (!form.old_password)                  e.old_password = 'Current password is required';
    if (!form.new_password)                  e.new_password = 'New password is required';
    else if (form.new_password.length < 6)   e.new_password = 'At least 6 characters';
    if (form.new_password !== form.confirm)  e.confirm      = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { changePassword } = await import('@/api/auth');
      await changePassword(form.old_password, form.new_password);
      Alert.alert('Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not update password. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
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
        <PasswordField
          label="CURRENT PASSWORD"
          value={form.old_password}
          onChangeText={(v) => setField('old_password', v)}
          error={errors.old_password}
        />
        <PasswordField
          label="NEW PASSWORD"
          value={form.new_password}
          onChangeText={(v) => setField('new_password', v)}
          error={errors.new_password}
        />
        <PasswordField
          label="CONFIRM NEW PASSWORD"
          value={form.confirm}
          onChangeText={(v) => setField('confirm', v)}
          error={errors.confirm}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FAF7F2" />
            : <Text style={styles.btnText}>Update Password</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },

  field:      { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#9A8478', letterSpacing: 0.8, marginBottom: 6 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#F3EDE3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#2C1F14',
  },
  inputError: { borderWidth: 1.5, borderColor: '#B85450' },
  eyeBtn:     { position: 'absolute', right: 12 },
  errorText:  { fontSize: 12, color: '#B85450', marginTop: 4 },

  btn: {
    backgroundColor: '#2C1F14',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#FAF7F2', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});
