import { apiRequest } from '../config/api';

export const notificationService = {
  async getNotifications() {
    try {
      const res = await apiRequest('/notifications');
      return res.data?.notifications || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error.message);
      return [];
    }
  },

  async markAsRead(id) {
    const res = await apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return res.data || res;
  },

  async markAllAsRead() {
    const res = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
    return res.data || res;
  }
};
