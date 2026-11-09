import { apiRequest, storeAuthSession, clearAuthSession } from '../config/api';

export const authService = {
  // Register new account with backend
  async register(formData) {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const user = response?.data?.user || response?.user;
      const token = response?.token || response?.accessToken;

      if (token && user) {
        await storeAuthSession(token, user);
        return { success: true, user, token };
      }
      return { success: false, message: response?.message || 'Invalid response from server' };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error.message || 'Registration failed. Please check your connection.',
      };
    }
  },

  // Login with credentials
  async login(email, password) {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = response?.data?.user || response?.user;
      const token = response?.token || response?.accessToken;
      const refreshToken = response?.refreshToken || response?.data?.refreshToken;

      if (token && user) {
        await storeAuthSession(token, user, refreshToken);
        return { success: true, user, token };
      }
      return { success: false, message: response?.message || 'Invalid response from server' };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error.message || 'Invalid email or password. Please try again.',
      };
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true, message: response?.message || 'Password reset link sent to your email.' };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error.message || 'Failed to send reset link.',
      };
    }
  },

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await apiRequest(`/auth/reset-password/${token}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
      return { success: true, message: response?.message || 'Password reset successfully.' };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error.message || 'Failed to reset password.',
      };
    }
  },

  // Logout
  async logout() {
    await clearAuthSession();
    return { success: true };
  }
};
