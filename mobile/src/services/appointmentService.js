import { apiRequest } from '../config/api';

export const appointmentService = {
  async getMyAppointments() {
    try {
      const res = await apiRequest('/appointments');
      const list =
        res?.data?.appointments ||
        res?.appointments ||
        (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Failed to fetch appointments:', error.message);
      return [];
    }
  },

  async bookAppointment({ doctor_id, date, start_time, end_time }) {
    const res = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctor_id, date, start_time, end_time }),
    });
    return res.data?.appointment || res.data || res;
  },

  async updateAppointmentStatus(id, status, extra = {}) {
    const res = await apiRequest(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    });
    return res.data?.appointment || res.data || res;
  },

  async payAppointment(id) {
    const res = await apiRequest(`/appointments/${id}/pay`, {
      method: 'POST',
    });
    return res.data?.appointment || res.data || res;
  }
};
