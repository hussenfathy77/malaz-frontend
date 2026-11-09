import { apiRequest } from '../config/api';

export const caregiverService = {
  // Patient: invite a caregiver
  async inviteCaregiver({ email, consent_scope }) {
    const res = await apiRequest('/caregivers/invite', {
      method: 'POST',
      body: JSON.stringify({ email, consent_scope }),
    });
    return res.data?.caregiver || res.data || res;
  },

  // Patient: get list of caregivers assigned to me
  async getMyCaregivers() {
    try {
      const res = await apiRequest('/caregivers/my-caregivers');
      return res.data?.caregivers || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch my caregivers:', error.message);
      return [];
    }
  },

  // Caregiver: get invitations waiting for my acceptance
  async getMyInvitations() {
    try {
      const res = await apiRequest('/caregivers/my-invitations');
      return res.data?.invitations || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch caregiver invitations:', error.message);
      return [];
    }
  },

  // Caregiver: get active linked patients
  async getMyPatients() {
    try {
      const res = await apiRequest('/caregivers/my-patients');
      return res.data?.patients || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch caregiver patients:', error.message);
      return [];
    }
  },

  // Caregiver: get relation details by ID
  async getRelationById(id) {
    try {
      const res = await apiRequest(`/caregivers/relations/${id}`);
      return res.data?.relation || res.data || res;
    } catch (error) {
      console.error(`Failed to fetch relation ${id}:`, error.message);
      return null;
    }
  },

  // Caregiver: accept or revoke relationship status (ACTIVE / REVOKED)
  async updateCaregiverStatus(id, status) {
    const res = await apiRequest(`/caregivers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return res.data || res;
  },

  // Caregiver: view patient health & activity summary
  async getCaregiverSummary(patientId) {
    try {
      const res = await apiRequest(`/caregivers/patient/${patientId}/summary`);
      return res.data || res;
    } catch (error) {
      console.error('Failed to fetch caregiver summary:', error.message);
      return null;
    }
  }
};
