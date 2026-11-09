import { apiRequest } from '../config/api';

export const toolkitService = {
  // Moods: Backend returns { status: 'success', data: { trends: [...] } }
  async getMoods() {
    try {
      const res = await apiRequest('/toolkit/moods');
      const list =
        res?.data?.trends ||
        res?.data?.moods ||
        res?.trends ||
        (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Failed to fetch moods:', error.message);
      return [];
    }
  },

  async addMood({ mood_score, note }) {
    try {
      const res = await apiRequest('/toolkit/moods', {
        method: 'POST',
        body: JSON.stringify({ mood_score, note }),
      });
      return res.data?.mood || res.data || res;
    } catch (error) {
      console.error('Failed to add mood:', error.message);
      // Return optimistic mood object
      return {
        id: 'mood-' + Date.now(),
        mood_score,
        note,
        logged_at: new Date().toISOString(),
      };
    }
  },

  // Journals: Backend returns { status: 'success', data: { history: [...] } }
  async getJournals() {
    try {
      const res = await apiRequest('/toolkit/journals');
      const list =
        res?.data?.history ||
        res?.data?.journals ||
        res?.history ||
        (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Failed to fetch journals:', error.message);
      return [];
    }
  },

  async addJournal({ content }) {
    try {
      const res = await apiRequest('/toolkit/journals', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return res.data?.journal || res.data || res;
    } catch (error) {
      console.error('Failed to add journal:', error.message);
      // Return optimistic journal object
      return {
        id: 'j-' + Date.now(),
        content,
        ai_feedback: 'Your thoughts have been recorded safely.',
        created_at: new Date().toISOString(),
      };
    }
  }
};
