export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error setting localStorage key "${key}":`, e);
    }
  },
  
  remove(key) {
    localStorage.removeItem(key);
  },
  
  getSettings() {
    const defaultSettings = { duration: 30, mode: 'time', category: 'quotes', soundEnabled: false };
    return this.get('tc_settings', defaultSettings);
  },
  
  saveSettings(settings) {
    const current = this.getSettings();
    this.set('tc_settings', { ...current, ...settings });
  },
  
  getHistory() {
    return this.get('tc_history', []);
  },
  
  addToHistory(result) {
    const history = this.getHistory();
    history.unshift(result);
    if (history.length > 50) {
      history.length = 50;
    }
    this.set('tc_history', history);
  },
  
  getGuestId() {
    let id = this.get('tc_guest_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substring(2);
      this.set('tc_guest_id', id);
    }
    return id;
  },
  
  getTestCount() {
    return this.get('tc_test_count', 0);
  },
  
  incrementTestCount() {
    const count = this.getTestCount() + 1;
    this.set('tc_test_count', count);
    return count;
  },
  
  getPersonalBests() {
    return this.get('tc_personal_bests', {});
  },
  
  updatePersonalBest(mode, duration, wpm) {
    const bests = this.getPersonalBests();
    const key = `${mode}_${duration}`;
    const previousBest = bests[key] || 0;
    
    let isNewBest = false;
    if (wpm > previousBest) {
      bests[key] = wpm;
      this.set('tc_personal_bests', bests);
      isNewBest = true;
    }
    
    return { isNewBest, previousBest };
  },

  getUsername() {
    return this.get('tc_username', null);
  },

  setUsername(username) {
    this.set('tc_username', username);
  }
};
