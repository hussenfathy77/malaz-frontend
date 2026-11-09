import { apiRequest } from '../config/api';

export const userService = {
  // Get current user profile from server
  async getProfile() {
    try {
      const res = await apiRequest('/users/profile');
      return res.data?.user || res.data || res;
    } catch (error) {
      console.error('Failed to get user profile:', error.message);
      throw error;
    }
  },

  // Update profile (e.g., full_name, profile_pic)
  async updateProfile(data) {
    try {
      const res = await apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data?.user || res.data || res;
    } catch (error) {
      console.error('Failed to update profile:', error.message);
      throw error;
    }
  },

  // Change password with old and new passwords
  async changePassword(old_password, new_password) {
    try {
      const res = await apiRequest('/users/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ old_password, new_password }),
      });
      return res;
    } catch (error) {
      console.error('Failed to change password:', error.message);
      throw error;
    }
  },

  // Delete account permanently
  async deleteAccount() {
    try {
      const res = await apiRequest('/users/account', {
        method: 'DELETE',
      });
      return res;
    } catch (error) {
      console.error('Failed to delete account:', error.message);
      throw error;
    }
  },

  // Update location (latitude, longitude, address)
  async updateLocation({ latitude, longitude, address }) {
    try {
      const res = await apiRequest('/users/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude, address }),
      });
      return res.data || res;
    } catch (error) {
      console.error('Failed to update location:', error.message);
      throw error;
    }
  },
};
