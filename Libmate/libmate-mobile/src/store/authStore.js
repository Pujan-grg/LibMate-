import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  membership: null,
  hasActiveMembership: false,
  isLoading: true,

  setAuth: (token, user, membership, hasActiveMembership) => {
    set({ token, user, membership, hasActiveMembership });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null, membership: null, hasActiveMembership: false });
  },

  setUser: (user) => set({ user }),
  setMembership: (membership, hasActiveMembership) =>
    set({ membership, hasActiveMembership }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useAuthStore;
