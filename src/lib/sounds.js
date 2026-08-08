import { storage } from './storage.js';

export const sounds = {
  audioCtx: null,
  
  init() {
    // Only init context on first sound play to comply with browser autoplay policies
  },
  
  _ensureContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },
  
  playKeystroke() {
    if (!this.isEnabled()) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.02);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.02);
  },
  
  playError() {
    if (!this.isEnabled()) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.05);
  },
  
  playComplete() {
    if (!this.isEnabled()) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    
    const t = this.audioCtx.currentTime;
    
    const playNote = (freq, startTime, duration) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    playNote(523.25, t, 0.2); // C5
    playNote(659.25, t + 0.2, 0.4); // E5
  },
  
  setEnabled(enabled) {
    const settings = storage.getSettings();
    settings.soundEnabled = !!enabled;
    storage.saveSettings(settings);
  },
  
  isEnabled() {
    return storage.getSettings().soundEnabled;
  }
};
