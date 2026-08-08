export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

export function formatTime(ms) {
  if (!isFinite(ms)) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatWPM(wpm) {
  return Math.round(wpm).toString();
}

export function formatAccuracy(acc) {
  return acc.toFixed(1) + '%';
}

export function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function isMobile() {
  return window.innerWidth < 768;
}

export function createElement(tag, className, attrs = {}) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function normalizeCollege(rawCollege) {
  if (!rawCollege || !rawCollege.trim()) return 'General';
  const clean = rawCollege.trim().replace(/\s+/g, ' ');
  const lower = clean.toLowerCase();

  // Common university alias mappings
  if (/^kiit|kalinga/i.test(lower)) return 'KIIT University';
  if (/^iit\s*b(ombay)?$/i.test(lower)) return 'IIT Bombay';
  if (/^iit\s*d(elhi)?$/i.test(lower)) return 'IIT Delhi';
  if (/^iit\s*k(anpur)?$/i.test(lower)) return 'IIT Kanpur';
  if (/^iit\s*m(adras)?$/i.test(lower)) return 'IIT Madras';
  if (/^iit\s*k(haragpur)?$/i.test(lower)) return 'IIT Kharagpur';
  if (/^bits|pilani/i.test(lower)) return 'BITS Pilani';
  if (/^vit|vellore/i.test(lower)) return 'VIT Vellore';
  if (/^srm/i.test(lower)) return 'SRM University';
  if (/^dtu|delhi tech/i.test(lower)) return 'DTU Delhi';
  if (/^nsut|netaji/i.test(lower)) return 'NSUT Delhi';

  // Capitalize nicely
  return clean
    .split(' ')
    .map(word => word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
