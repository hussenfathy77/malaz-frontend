import { apiRequest } from '../config/api';

export const clinicalNotesService = {
  async getNotes(patientId = null) {
    try {
      const endpoint = patientId ? `/clinical-notes?patientId=${patientId}` : '/clinical-notes';
      const res = await apiRequest(endpoint);
      return res.data?.notes || res.data || res || [];
    } catch (error) {
      console.error('Failed to fetch clinical notes:', error.message);
      return [];
    }
  },

  async createNote({ appointment_id, patient_id, diagnosis, treatment_plan, notes }) {
    const res = await apiRequest('/clinical-notes', {
      method: 'POST',
      body: JSON.stringify({ appointment_id, patient_id, diagnosis, treatment_plan, notes }),
    });
    return res.data?.note || res.data || res;
  },

  async updateNote(id, { diagnosis, treatment_plan, notes }) {
    const res = await apiRequest(`/clinical-notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ diagnosis, treatment_plan, notes }),
    });
    return res.data?.note || res.data || res;
  }
};
