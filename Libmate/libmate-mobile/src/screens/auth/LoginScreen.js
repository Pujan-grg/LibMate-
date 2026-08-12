/**
 * LoginScreen
 *
 * Matches wireframe: logo → title → card with Login/Register tab switcher.
 * Login tab:    EMAIL, PASSWORD, Forget Password?, LOGIN button
 * Register tab: Full Name, Email, Phone, Password, Confirm Password, CREATE ACCOUNT button
 */
import React, { useState, useRef } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { login, register, forgotPassword, resetPassword, getMe } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { getMyWishlist } from '@/api/users';
import useAuthStore from '@/store/authStore';
import useWishlistStore from '@/store/wishlistStore';

const LOGO = require('../../../assets/logo_icon.png');

async function bootstrapAfterAuth(token, setAuth, seedWishlist) {
  await SecureStore.setItemAsync('auth_token', token);
  const { data } = await getMe();
  setAuth(token, data.user, data.membership, data.has_active_membership);
  try {
    const { data: wl } = await getMyWishlist();
    if (Array.isArray(wl)) seedWishlist(wl);
  } catch { /* non-critical */ }
}

// ── Forgot / Reset Password bottom-sheet ─────────────────────────
function ForgotPasswordModal({ visible, onClose }) {
  const [step, setStep]         = useState('request'); // 'request' | 'sent' | 'reset'
  const [email, setEmail]       = useState('');
  const [token, setToken]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  function handleClose() {
    setStep('request'); setEmail(''); setToken(''); setPassword(''); setConfirm('');
    onClose();
  }

  async function handleSendEmail() {
    if (!email.trim()) { Alert.alert('Required', 'Please enter your email address.'); return; }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep('sent');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!token.trim()) { Alert.alert('Required', 'Please paste your reset token.'); return; }
    if (!password)     { Alert.alert('Required', 'Please enter a new password.'); return; }
    if (password.length < 6) { Alert.alert('Too Short', 'Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      Alert.alert('Password Reset', 'Your password has been reset. You can now log in.');
      handleClose();
    } catch (err) {
      Alert.alert('Reset Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={fpStyles.overlay}>
          <TouchableOpacity style={fpStyles.backdrop} onPress={handleClose} activeOpacity={1} />
          <View style={fpStyles.sheet}>
            <View style={fpStyles.handle} />

            {step === 'request' && (
              <>
                <Text style={fpStyles.title}>Forgot Password</Text>
                <Text style={fpStyles.subtitle}>Enter your account email and we'll send a reset link.</Text>
                <Text style={fpStyles.label}>EMAIL</Text>
                <TextInput
                  style={fpStyles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9A8478"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={handleSendEmail}
                />
                <TouchableOpacity
                  style={[fpStyles.primaryBtn, loading && fpStyles.btnDisabled]}
                  onPress={handleSendEmail}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#FAF7F2" />
                    : <Text style={fpStyles.primaryBtnText}>Send Reset Email</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={fpStyles.cancelBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={fpStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'sent' && (
              <>
                <View style={fpStyles.iconWrap}>
                  <MaterialCommunityIcons name="email-check-outline" size={44} color="#C4895A" />
                </View>
                <Text style={fpStyles.title}>Check Your Email</Text>
                <Text style={fpStyles.subtitle}>
                  A reset link has been sent to {email}.{'\n\n'}
                  Open the email, copy the long token at the end of the reset URL, then tap below to continue.
                </Text>
                <TouchableOpacity
                  style={fpStyles.primaryBtn}
                  onPress={() => setStep('reset')}
                  activeOpacity={0.85}
                >
                  <Text style={fpStyles.primaryBtnText}>I Have My Token</Text>
                </TouchableOpacity>
                <TouchableOpacity style={fpStyles.cancelBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={fpStyles.cancelText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <Text style={fpStyles.title}>Reset Password</Text>
                <Text style={fpStyles.subtitle}>Paste the token from your reset email, then enter a new password.</Text>
                <Text style={fpStyles.label}>RESET TOKEN</Text>
                <TextInput
                  style={[fpStyles.input, { fontSize: 11 }]}
                  placeholder="Paste the full token from the reset URL…"
                  placeholderTextColor="#9A8478"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  numberOfLines={3}
                />
                <Text style={fpStyles.label}>NEW PASSWORD</Text>
                <TextInput
                  style={fpStyles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9A8478"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="next"
                />
                <Text style={fpStyles.label}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={fpStyles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9A8478"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <TouchableOpacity
                  style={[fpStyles.primaryBtn, loading && fpStyles.btnDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#FAF7F2" />
                    : <Text style={fpStyles.primaryBtnText}>Reset Password</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={fpStyles.cancelBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={fpStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, error, ...inputProps }) {
  const [secure, setSecure] = useState(inputProps.secureTextEntry || false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholderTextColor="#9A8478"
          {...inputProps}
          secureTextEntry={secure}
        />
        {inputProps.secureTextEntry && (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setSecure((s) => !s)}>
            <MaterialCommunityIcons
              name={secure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#9A8478"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function LoginForm() {
  const { setAuth } = useAuthStore();
  const { setWishlist: seedWishlist } = useWishlistStore();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [showForgot, setShowForgot]   = useState(false);
  const passwordRef                   = useRef(null);

  function validate() {
    const e = {};
    if (!email.trim())  e.email    = 'Email is required';
    if (!password)      e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await login(email.trim().toLowerCase(), password);
      await bootstrapAfterAuth(data.token, setAuth, seedWishlist);
    } catch (err) {
      Alert.alert('Login failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Field
        label="EMAIL"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        value={email}
        onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <Field
        label="PASSWORD"
        placeholder="••••••••"
        secureTextEntry
        returnKeyType="done"
        ref={passwordRef}
        value={password}
        onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
        onSubmitEditing={handleLogin}
        error={errors.password}
      />

      <TouchableOpacity
        style={styles.forgotWrap}
        onPress={() => setShowForgot(true)}
      >
        <Text style={styles.forgotText}>Forget Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#FAF7F2" />
          : <Text style={styles.primaryBtnText}>LOGIN</Text>
        }
      </TouchableOpacity>

      <ForgotPasswordModal visible={showForgot} onClose={() => setShowForgot(false)} />
    </>
  );
}

function RegisterForm() {
  const { setAuth } = useAuthStore();
  const { setWishlist: seedWishlist } = useWishlistStore();
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim())                              e.full_name        = 'Full name is required';
    if (!form.email.trim())                                  e.email            = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))              e.email            = 'Invalid email address';
    if (!form.password)                                      e.password         = 'Password is required';
    else if (form.password.length < 6)                       e.password         = 'At least 6 characters';
    if (form.password !== form.confirm_password)             e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await register({
        full_name: form.full_name.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        phone:     form.phone.trim() || undefined,
      });
      await bootstrapAfterAuth(data.token, setAuth, seedWishlist);
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Field label="FULL NAME"        placeholder="Jane Doe"           value={form.full_name}        onChangeText={(v) => setField('full_name', v)}        error={errors.full_name}        returnKeyType="next" />
      <Field label="EMAIL"            placeholder="you@example.com"    value={form.email}            onChangeText={(v) => setField('email', v)}            error={errors.email}            returnKeyType="next" autoCapitalize="none" keyboardType="email-address" />
      <Field label="PHONE (OPTIONAL)" placeholder="+44 7911 000000"    value={form.phone}            onChangeText={(v) => setField('phone', v)}            error={errors.phone}            returnKeyType="next" keyboardType="phone-pad" />
      <Field label="PASSWORD"         placeholder="••••••••"           value={form.password}         onChangeText={(v) => setField('password', v)}         error={errors.password}         secureTextEntry returnKeyType="next" />
      <Field label="CONFIRM PASSWORD" placeholder="••••••••"           value={form.confirm_password} onChangeText={(v) => setField('confirm_password', v)} error={errors.confirm_password} secureTextEntry returnKeyType="done" onSubmitEditing={handleRegister} />

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#FAF7F2" />
          : <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        }
      </TouchableOpacity>
    </>
  );
}

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState('Login');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Welcome to Libmate</Text>
          <Text style={styles.subtitle}>Sign in to access the library</Text>

          <View style={styles.card}>
            <View style={styles.tabRow}>
              {['Login', 'Register'].map((tab) => (
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

            <View style={styles.form}>
              {activeTab === 'Login' ? <LoginForm /> : <RegisterForm />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },

  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logo:     { width: 96, height: 96 },

  title:    { fontSize: 26, fontWeight: '800', color: '#2C1F14', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9A8478', textAlign: 'center', marginBottom: 28 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#2C1F14',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },

  tabRow:        { flexDirection: 'row' },
  tabBtn:        { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabText:       { fontSize: 15, fontWeight: '600', color: '#9A8478' },
  tabTextActive: { color: '#2C1F14' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 20, right: 20,
    height: 2, backgroundColor: '#2C1F14', borderRadius: 1,
  },
  tabDivider: { height: 1, backgroundColor: '#EAE0D0' },

  form: { padding: 20 },

  field:      { marginBottom: 14 },
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

  forgotWrap: { alignItems: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { fontSize: 13, color: '#9A8478' },

  primaryBtn: {
    backgroundColor: '#2C1F14',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled:    { opacity: 0.6 },
  primaryBtnText: { color: '#FAF7F2', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

});

const fpStyles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,31,20,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
  },
  handle:    { width: 40, height: 4, backgroundColor: '#EAE0D0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  iconWrap:  { alignItems: 'center', marginBottom: 12 },
  title:     { fontSize: 20, fontWeight: '800', color: '#2C1F14', marginBottom: 8 },
  subtitle:  { fontSize: 14, color: '#9A8478', lineHeight: 20, marginBottom: 20 },
  label:     { fontSize: 11, fontWeight: '700', color: '#9A8478', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#F3EDE3', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#2C1F14', marginBottom: 14,
  },
  primaryBtn:     { backgroundColor: '#2C1F14', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  btnDisabled:    { opacity: 0.6 },
  primaryBtnText: { color: '#FAF7F2', fontSize: 15, fontWeight: '700' },
  cancelBtn:      { backgroundColor: '#EAE0D0', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  cancelText:     { fontSize: 15, fontWeight: '600', color: '#4A3728' },
});
