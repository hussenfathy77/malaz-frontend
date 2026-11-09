import { apiRequest } from '../config/api';

export const adminService = {
  // Get all unverified doctors
  async getUnverifiedDoctors() {
    try {
      const res = await apiRequest('/admin/doctors/unverified');
      return res.data?.doctors || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch unverified doctors:', error.message);
      return [];
    }
  },

  // Verify and certify doctor
  async verifyDoctor(id) {
    const res = await apiRequest(`/admin/doctors/${id}/verify`, {
      method: 'PATCH',
    });
    return res.data || res;
  },

  // Get users list with optional search, role, status filters
  async getUsers(query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
      const res = await apiRequest(endpoint);
      return res.data?.users || res.users || res.data || [];
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      return [];
    }
  },

  // Get single user by ID
  async getUserById(id) {
    try {
      const res = await apiRequest(`/admin/users/${id}`);
      return res.data?.user || res.data || res;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error.message);
      return null;
    }
  },

  // Update user status (ACTIVE / SUSPENDED)
  async updateUserStatus(id, status) {
    const res = await apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data || res;
  },

  // Update safe circle
  async updateSafeCircle(id, data) {
    const res = await apiRequest(`/admin/safe-circles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data || res;
  },

  // Delete safe circle
  async deleteSafeCircle(id) {
    const res = await apiRequest(`/admin/safe-circles/${id}`, {
      method: 'DELETE',
    });
    return res.data || res;
  }
};
