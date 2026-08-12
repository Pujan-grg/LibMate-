import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { register } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import useAuthStore from '@/store/authStore';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      const { data } = await register(payload);
      await SecureStore.setItemAsync('auth_token', data.token);
      setAuth(data.token, data.user, data.membership, data.has_active_membership);
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'full_name', label: 'Full Name', placeholder: 'Jane Doe' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'phone', label: 'Phone (optional)', placeholder: '+1 234 567 8900', keyboardType: 'phone-pad' },
    { key: 'address', label: 'Address (optional)', placeholder: '123 Main St', multiline: true },
    { key: 'password', label: 'Password', placeholder: '••••••••', secureTextEntry: true },
    { key: 'confirm_password', label: 'Confirm Password', placeholder: '••••••••', secureTextEntry: true },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Libmate to start borrowing books</Text>

        {fields.map(({ key, label, ...rest }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={[
                styles.input,
                errors[key] && styles.inputError,
                rest.multiline && styles.inputMultiline,
              ]}
              value={form[key]}
              onChangeText={(v) => setField(key, v)}
              {...rest}
            />
            {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  button: {
    backgroundColor: '#2C1F14',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkBold: { color: '#2C1F14', fontWeight: '600' },
});
