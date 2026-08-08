import { storage } from './storage.js';

export const theme = {
  init() {
    const savedTheme = this.getTheme();
    this.applyTheme(savedTheme);
  },
  
  getTheme() {
    return storage.get('tc_theme', 'dark');
  },
  
  setTheme(name) {
    this.applyTheme(name);
    storage.set('tc_theme', name);
  },
  
  applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
  }
};
