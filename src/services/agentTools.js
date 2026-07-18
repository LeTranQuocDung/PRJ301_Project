const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';

export const agentTools = {
  // 1. Tool to get learning content
  async getLearningContent(langCode) {
    try {
      const res = await fetch(`${API_BASE}/api/contents?lang=${langCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Agent tool getLearningContent offline, using local fallback:', err.message);
      return [
        { id: 'en1', level: 1, title: 'Greetings', stage: 'Stage 1', vocab: 'hello, goodbye', grammar: 'Subject pronouns' }
      ];
    }
  },

  // 2. Tool to get user learning progress
  async getUserProgress(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/progress?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Agent tool getUserProgress offline, using local fallback:', err.message);
      return { totalXp: 150, progressList: [] };
    }
  },

  // 3. Tool to lookup wallet balance
  async getWalletBalance(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/balance?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Agent tool getWalletBalance offline, using local fallback:', err.message);
      return { userId, balance: 150000.0, currency: 'VND' };
    }
  },

  // 4. Tool to fetch room audio podcasts
  async getPodcasts() {
    try {
      const res = await fetch(`${API_BASE}/api/podcasts/recordings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Agent tool getPodcasts offline, using local fallback:', err.message);
      return [
        { id: 'rec_1', title: 'Introduction to IELTS', language: 'English', duration: '12:34' }
      ];
    }
  },

  // 5. Tool to get admin insights
  async getAdminInsights() {
    try {
      const res = await fetch(`${API_BASE}/api/agent/admin-insights`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Agent tool getAdminInsights offline, using local fallback:', err.message);
      return {
        activeClassrooms: 5,
        contentHealth: '92%',
        weakAreas: ['Chinese Level 3 Tones'],
        riskAlerts: ['2 students inactive for > 7 days']
      };
    }
  }
};
