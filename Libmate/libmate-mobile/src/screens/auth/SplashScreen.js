import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '@/api/auth';
import useAuthStore from '@/store/authStore';

export default function SplashScreen() {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          const { data } = await getMe();
          setAuth(
            token,
            data.user,
            data.membership,
            data.has_active_membership
          );
        }
      } catch {
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2C1F14" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
