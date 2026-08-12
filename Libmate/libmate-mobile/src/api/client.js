import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getLocalApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  let ipAddress = '127.0.0.1'; // fallback
  if (Constants.expoConfig?.hostUri) {
    ipAddress = Constants.expoConfig.hostUri.split(':')[0];
  } else if (Platform.OS === 'android') {
    ipAddress = '10.0.2.2';
  }

  return `http://${ipAddress}:5000/api`;
};

const API_BASE_URL = getLocalApiUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and let the navigator react
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // useAuthStore will detect the cleared token via its listener
    }
    return Promise.reject(error);
  }
);

// Extract the error message from the standard {"error": "message"} shape
export function getErrorMessage(error) {
  return error.response?.data?.error || error.message || 'Something went wrong';
}

// Build full URL for a book cover filename returned by the backend (e.g. "cover_1.jpg")
export function getCoverUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${SERVER_BASE_URL}/uploads/covers/${filename}`;
}

export default client;
