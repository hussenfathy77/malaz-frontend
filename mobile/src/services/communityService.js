import { apiRequest } from '../config/api';

export const communityService = {
  async getCircles() {
    try {
      const res = await apiRequest('/circles');
      return res.data?.circles || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch circles:', error.message);
      return [];
    }
  },

  async createCircle({ name, description }) {
    const res = await apiRequest('/circles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return res.data?.circle || res.data || res;
  },

  async joinCircle(circleId) {
    try {
      const res = await apiRequest(`/circles/${circleId}/join`, {
        method: 'POST',
      });
      return res.data || res;
    } catch (err) {
      if (err.message && (err.message.toLowerCase().includes('already') || err.message.toLowerCase().includes('pending'))) {
        return { success: true, alreadyMember: true };
      }
      throw err;
    }
  },

  async leaveCircle(circleId) {
    const res = await apiRequest(`/circles/${circleId}/leave`, {
      method: 'DELETE',
    });
    return res.data || res;
  },

  async addPatientToCircle(circleId, patientId) {
    const res = await apiRequest(`/circles/${circleId}/add-patient`, {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId }),
    });
    return res.data || res;
  },

  async getMessages(circleId) {
    try {
      const res = await apiRequest(`/circles/${circleId}/messages`);
      return res.data?.messages || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error.message);
      return [];
    }
  },

  async sendMessage(circleId, content) {
    const res = await apiRequest(`/circles/${circleId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return res.data?.message || res.data || res;
  },

  // Join request management (for DOCTOR/ADMIN circle admins)
  async getJoinRequests(circleId) {
    try {
      const res = await apiRequest(`/circles/${circleId}/requests`);
      return res.data?.requests || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch join requests:', error.message);
      return [];
    }
  },

  async approveMember(circleId, memberId) {
    const res = await apiRequest(`/circles/${circleId}/members/${memberId}/approve`, {
      method: 'PATCH',
    });
    return res.data || res;
  },

  async rejectMember(circleId, memberId) {
    const res = await apiRequest(`/circles/${circleId}/members/${memberId}/reject`, {
      method: 'PATCH',
    });
    return res.data || res;
  },
};
