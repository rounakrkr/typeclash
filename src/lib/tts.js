/**
 * TypeClash — Text-to-Speech Manager
 * Uses the Web Speech API (SpeechSynthesis) for voice mode.
 */
export const tts = {
  synth: window.speechSynthesis,
  rate: 1.0,
  voice: null,
  utterance: null,
  _voicesLoaded: false,

  /**
   * Initialize — preload voices (some browsers load them async).
   */
  init() {
    if (!this.synth) return;
    // Voices may load asynchronously
    if (this.synth.getVoices().length > 0) {
      this._voicesLoaded = true;
      this._pickDefaultVoice();
    }
    // Use onvoiceschanged (Safari compatible) instead of addEventListener
    this.synth.onvoiceschanged = () => {
      this._voicesLoaded = true;
      this._pickDefaultVoice();
    };
  },

  /**
   * Pick the best default English voice.
   * Prefers Microsoft/Google high-quality voices.
   */
  _pickDefaultVoice() {
    const voices = this.getVoices();
    if (this.voice && voices.find(v => v.name === this.voice.name)) return; // Already set and still available

    // Prefer these voice names — clearest first
    const preferred = [
      'Google US English',
      'Google UK English Female',
      'Google UK English Male',
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Samantha',             // macOS
      'Daniel',               // macOS UK
      'Microsoft Mark Online',
      'Microsoft Zira',
      'Microsoft David',
      'Alex'                  // macOS fallback
    ];

    for (const name of preferred) {
      const match = voices.find(v => v.name.includes(name));
      if (match) {
        this.voice = match;
        return;
      }
    }

    // Fallback: first English voice
    if (voices.length > 0) {
      this.voice = voices[0];
    }
  },

  /**
   * Get available English voices.
   */
  getVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices().filter(v => v.lang.startsWith('en'));
  },

  /**
   * Set speaking rate (0.5 to 2.0).
   */
  setRate(rate) {
    this.rate = Math.max(0.3, Math.min(2.5, rate));
  },

  /**
   * Set voice by name or voice object.
   */
  setVoice(voiceOrName) {
    if (typeof voiceOrName === 'string') {
      const match = this.getVoices().find(v => v.name === voiceOrName);
      if (match) this.voice = match;
    } else {
      this.voice = voiceOrName;
    }
  },

  /**
   * Speak text with optional callbacks.
   * @param {string} text - Text to speak
   * @param {object} options - { rate, onEnd, onBoundary }
   */
  speak(text, options = {}) {
    if (!this.synth) return;
    this.stop();

    // Sanitize for natural speech
    const cleanText = this.sanitizeForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || this.rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (this.voice) {
      utterance.voice = this.voice;
    }

    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          options.onBoundary({
            charIndex: e.charIndex,
            charLength: e.charLength || 1,
            word: text.substring(e.charIndex, e.charIndex + (e.charLength || 5))
          });
        }
      };
    }

    this.utterance = utterance;
    this.synth.speak(utterance);
  },

  /**
   * Stop all speech.
   */
  stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.utterance = null;
  },

  /**
   * Pause speech.
   */
  pause() {
    if (!this.synth) return;
    this.synth.pause();
  },

  /**
   * Resume speech.
   */
  resume() {
    if (!this.synth) return;
    this.synth.resume();
  },

  /**
   * Check if currently speaking.
   */
  isSpeaking() {
    if (!this.synth) return false;
    return this.synth.speaking;
  },

  /**
   * Check if TTS is supported.
   */
  isSupported() {
    return 'speechSynthesis' in window;
  },

  /**
   * Sanitize text for natural TTS reading.
   * Converts code-like characters into speakable words.
   */
  sanitizeForSpeech(text) {
    let clean = text;

    // Replace common operators/symbols with spoken equivalents
    clean = clean.replace(/=>/g, ' arrow ');
    clean = clean.replace(/!==/g, ' not strictly equals ');
    clean = clean.replace(/!=/g, ' not equals ');
    clean = clean.replace(/===/g, ' strictly equals ');
    clean = clean.replace(/==/g, ' equals equals ');
    clean = clean.replace(/\|\|/g, ' or ');
    clean = clean.replace(/&&/g, ' and ');
    clean = clean.replace(/<=/g, ' less than or equal ');
    clean = clean.replace(/>=/g, ' greater than or equal ');
    clean = clean.replace(/\+=/g, ' plus equals ');
    clean = clean.replace(/-=/g, ' minus equals ');
    clean = clean.replace(/\.\.\./g, ' spread ');

    // Remove or replace brackets/braces
    clean = clean.replace(/[{}]/g, '');
    clean = clean.replace(/\[/g, ' ');
    clean = clean.replace(/\]/g, ' ');
    clean = clean.replace(/\(/g, ' ');
    clean = clean.replace(/\)/g, ' ');

    // Replace underscores with spaces (snake_case → spoken words)
    clean = clean.replace(/_/g, ' ');

    // Split camelCase and PascalCase into words
    // e.g., "getElementById" → "get Element By Id"
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Replace common code punctuation
    clean = clean.replace(/;/g, '');
    clean = clean.replace(/\$/g, '');
    clean = clean.replace(/#/g, ' hash ');
    clean = clean.replace(/@/g, ' at ');
    clean = clean.replace(/`/g, '');
    clean = clean.replace(/\\/g, ' ');
    clean = clean.replace(/\/\//g, '');  // comments

    // Clean up multiple spaces
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }
};
