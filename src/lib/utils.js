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
