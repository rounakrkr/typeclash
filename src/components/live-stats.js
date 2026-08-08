export function createLiveStats() {
  const container = document.createElement('div');
  container.className = 'live-stats';
  
  container.innerHTML = `
    <div class="live-stats-item">
      <span class="live-stats-label">WPM</span>
      <span class="live-stats-val" id="live-wpm">0</span>
    </div>
    <div class="live-stats-item">
      <span class="live-stats-label">ACC</span>
      <span class="live-stats-val" id="live-acc">100%</span>
    </div>
  `;
  
  const wpmEl = container.querySelector('#live-wpm');
  const accEl = container.querySelector('#live-acc');
  
  return {
    element: container,
    updateWPM(wpm) {
      wpmEl.textContent = Math.round(wpm);
    },
    updateAccuracy(acc) {
      accEl.textContent = Math.round(acc) + '%';
    },
    reset() {
      wpmEl.textContent = '0';
      accEl.textContent = '100%';
    }
  };
}
