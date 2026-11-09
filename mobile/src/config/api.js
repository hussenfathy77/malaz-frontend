import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Local machine Wi-Fi IP for physical Android/iOS devices connecting over Wi-Fi
const DEV_LAN_IP = '192.168.1.24';

// Use localhost for Web, and LAN IP for mobile devices
const DEFAULT_HOST = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : `http://${DEV_LAN_IP}:3000`;

export const DEFAULT_API_BASE = `${DEFAULT_HOST}/api/v1`;

const API_BASE_KEY = '@malaz_api_base_url';
const TOKEN_KEY = '@malaz_auth_token';
const REFRESH_TOKEN_KEY = '@malaz_refresh_token';
const USER_KEY = '@malaz_current_user';

export const getApiBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(API_BASE_KEY);
    return saved || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
};

export const setApiBaseUrl = async (url) => {
  try {
    await AsyncStorage.setItem(API_BASE_KEY, url);
  } catch (e) {
    console.error('Error saving API base URL', e);
  }
};

export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const storeAuthSession = async (token, user, refreshToken = null) => {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('Error storing session', e);
  }
};

export const clearAuthSession = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  } catch (e) {
    console.error('Error clearing session', e);
  }
};

export const getStoredUser = async () => {
  try {
    const str = await AsyncStorage.getItem(USER_KEY);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
};

// Generic API request function
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = await getApiBaseUrl();
  const token = await getStoredToken();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || error.message?.includes('canceled')) {
      const timeoutError = new Error(`Connection timeout: Unable to reach server at ${baseUrl}. Please verify the backend is running.`);
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  }
};
