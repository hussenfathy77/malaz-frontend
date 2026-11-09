import { apiRequest } from '../config/api';

export const workingHoursService = {
  async getWorkingHours() {
    try {
      const res = await apiRequest('/working-hours');
      return res.data?.workingHours || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch working hours:', error.message);
      return [];
    }
  },

  async setWorkingHours({ day_of_week, start_time, end_time }) {
    const res = await apiRequest('/working-hours', {
      method: 'POST',
      body: JSON.stringify({ day_of_week, start_time, end_time }),
    });
    return res.data || res;
  },

  async deleteWorkingHours(id) {
    const res = await apiRequest(`/working-hours/${id}`, {
      method: 'DELETE',
    });
    return res.data || res;
  }
};
