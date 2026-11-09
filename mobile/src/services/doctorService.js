import { apiRequest } from '../config/api';

export const doctorService = {
  async getDoctors(query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = queryString ? `/doctors?${queryString}` : '/doctors';
      const res = await apiRequest(endpoint);
      return res.data?.doctors || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch doctors:', error.message);
      return [];
    }
  },

  async getDoctorById(id) {
    try {
      const res = await apiRequest(`/doctors/${id}`);
      return res.data?.doctor || res.data || res;
    } catch (error) {
      console.error(`Failed to fetch doctor ${id}:`, error.message);
      return null;
    }
  },

  async updateDoctorProfile(profileData) {
    const res = await apiRequest('/doctors/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    return res.data || res;
  },

  async getDoctorReviews(doctorId) {
    try {
      const res = await apiRequest(`/doctors/${doctorId}/reviews`);
      return res.data?.reviews || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch reviews:', error.message);
      return [];
    }
  },

  async createReview(doctorId, { rating, comment }) {
    const res = await apiRequest(`/doctors/${doctorId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: Number(rating), comment: comment ? comment.trim() : undefined }),
    });
    return res.data?.review || res.data || res;
  },

  async getMyPatients() {
    try {
      const res = await apiRequest('/doctors/my-patients');
      return res.data?.patients || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch doctor patients:', error.message);
      return [];
    }
  },

  async getPatientById(patientId) {
    try {
      const res = await apiRequest(`/doctors/patients/${patientId}`);
      return res.data?.patient || res.data || res;
    } catch (error) {
      console.error(`Failed to fetch patient ${patientId}:`, error.message);
      return null;
    }
  },

  async getDoctorAvailability(doctorId, date) {
    try {
      const endpoint = date
        ? `/doctors/${doctorId}/availability?date=${encodeURIComponent(date)}`
        : `/doctors/${doctorId}/availability`;
      const res = await apiRequest(endpoint);
      return res.data?.slots || res.slots || [];
    } catch (error) {
      console.error(`Failed to fetch doctor availability:`, error.message);
      return [];
    }
  },

  async getPatientJournals(patientId) {
    try {
      const res = await apiRequest(`/doctors/patients/${patientId}/journals`);
      return res.data?.journals || res.data || res || [];
    } catch (error) {
      console.error(`Failed to fetch patient journals:`, error.message);
      return [];
    }
  },

  async getNearbyDoctors(lat, lng, radiusKm = 50) {
    try {
      const res = await apiRequest(`/doctors/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
      return res.data?.doctors || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch nearby doctors:', error.message);
      return [];
    }
  },
};
