import { createStatCard } from '../components/stats-card.js';
import { renderWPMChart } from '../components/wpm-chart.js';
import { generateResultCard } from '../components/result-card-generator.js';
import { renderErrorAnalysis } from '../components/error-analysis.js';
import { renderNavbar } from '../components/navbar.js';
import { storage } from '../lib/storage.js';
import { formatWPM, formatAccuracy, formatTime } from '../lib/utils.js';

/**
 * Get rank tier based on WPM.
 */
function getRank(wpm) {
  if (wpm >= 130) return { name: 'Grandmaster', emoji: '⚡', class: 'badge-grandmaster' };
  if (wpm >= 110) return { name: 'Master', emoji: '👑', class: 'badge-master' };
  if (wpm >= 90)  return { name: 'Diamond', emoji: '💠', class: 'badge-diamond' };
  if (wpm >= 70)  return { name: 'Platinum', emoji: '💎', class: 'badge-platinum' };
  if (wpm >= 50)  return { name: 'Gold', emoji: '🥇', class: 'badge-gold' };
  if (wpm >= 30)  return { name: 'Silver', emoji: '🥈', class: 'badge-silver' };
  return { name: 'Bronze', emoji: '🥉', class: 'badge-bronze' };
}

/**
 * Render the post-game results page.
 * Returns a cleanup function for event listener removal.
 */
export function renderResults(appEl, router) {
  const state = router.getState();

  // If no state (direct navigation), redirect home
  if (!state || state.wpm === undefined) {
    router.navigate('/');
    return;
  }

  const {
    wpm = 0, rawWpm = 0, accuracy = 100, consistency = 100,
    charStats = { correct: 0, incorrect: 0, total: 0 },
    perSecondWPM = [], errors = [], duration = 30, category = 'words',
    punctuation = false, voiceMode = false, elapsedMs = 0, textId = null
  } = state;

  const rank = getRank(wpm);

  // ── Persist results (only once per test, not on page refresh) ──
  let pbResult = { isNewBest: false, previousBest: 0 };
  if (state._fresh) {
    const mode = duration === 0 ? 'practice' : 'time';
    pbResult = storage.updatePersonalBest(mode, duration, Math.round(wpm));

    storage.addToHistory({
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: parseFloat(accuracy.toFixed(1)),
      consistency: parseFloat(consistency.toFixed(1)),
      duration,
      category,
      punctuation,
      charStats,
      rank: rank.name,
      date: new Date().toISOString()
    });

    storage.incrementTestCount();
    // Mark as consumed so refresh won't re-persist
    state._fresh = false;
  }

  // ── Build DOM ──
  appEl.appendChild(renderNavbar());

  const container = document.createElement('div');
  container.className = 'results-container fade-in-up';

  // Challenge Banner (if user completed a friend's challenge)
  const challengeData = state.challengeData;
  if (challengeData) {
    const creatorWpm = Math.round(challengeData.creatorWpm || 0);
    const myWpm = Math.round(wpm);
    const won = myWpm >= creatorWpm;

    const challengeBanner = document.createElement('div');
    challengeBanner.className = `challenge-comparison-banner ${won ? 'won' : 'lost'}`;
    challengeBanner.innerHTML = `
      <div class="challenge-result-badge">${won ? '🎉 VICTORY!' : '💔 DEFEAT!'}</div>
      <p class="challenge-result-text">
        You typed <strong>${myWpm} WPM</strong> vs <strong>${escapeHtml(challengeData.creatorName)}'s ${creatorWpm} WPM</strong>
      </p>
    `;
    container.appendChild(challengeBanner);
  }

  // WPM Display (hero)
  const resultsHeader = document.createElement('div');
  resultsHeader.className = 'results-header';
  resultsHeader.innerHTML = `
    <div class="wpm-display text-gradient">${formatWPM(wpm)}</div>
    <div class="wpm-label">words per minute</div>
    <div class="rank-badge badge ${rank.class}">${rank.emoji} ${rank.name}</div>
    ${pbResult.isNewBest ? `
      <div class="personal-best-badge">
        🎉 New Personal Best!
        ${pbResult.previousBest > 0 ? `<span class="pb-previous">Previous: ${pbResult.previousBest} WPM</span>` : ''}
      </div>
    ` : ''}
  `;
  container.appendChild(resultsHeader);

  // Stats Grid
  const grid = document.createElement('div');
  grid.className = 'stats-grid';
  grid.appendChild(createStatCard('WPM', formatWPM(wpm)));
  grid.appendChild(createStatCard('Raw WPM', formatWPM(rawWpm)));
  grid.appendChild(createStatCard('Accuracy', formatAccuracy(accuracy)));
  grid.appendChild(createStatCard('Consistency', formatAccuracy(consistency)));
  grid.appendChild(createStatCard('Characters', `${charStats.correct}/${charStats.incorrect}`));
  grid.appendChild(createStatCard('Time', formatTime(elapsedMs)));
  container.appendChild(grid);

  // WPM Chart
  if (perSecondWPM && perSecondWPM.length > 1) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    const canvas = document.createElement('canvas');
    canvas.id = 'wpm-chart';
    chartContainer.appendChild(canvas);
    container.appendChild(chartContainer);

    // Render chart after DOM insertion (needs dimensions)
    requestAnimationFrame(() => {
      renderWPMChart(canvas, perSecondWPM);
    });
  }

  // Error Analysis
  const errorAnalysis = renderErrorAnalysis(errors);
  container.appendChild(errorAnalysis);

  // Action Buttons
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  actions.innerHTML = `
    <button class="btn btn-primary" id="btn-next">Next Test</button>
    <button class="btn btn-secondary" id="btn-retry">Retry</button>
    <button class="btn btn-secondary" id="btn-challenge">🔗 Challenge Friend</button>
    <button class="btn btn-secondary" id="btn-share">📤 Share Card</button>
    <button class="btn btn-ghost" id="btn-history">📊 History</button>
    <button class="btn btn-ghost" id="btn-home">Home</button>
  `;
  container.appendChild(actions);

  // Keyboard hint
  const hint = document.createElement('div');
  hint.className = 'game-info';
  hint.innerHTML = '<kbd>Tab</kbd> + <kbd>Enter</kbd> for next test &nbsp;|&nbsp; <kbd>Esc</kbd> for home';
  container.appendChild(hint);

  appEl.appendChild(container);

  // ── Event Handlers ──
  document.getElementById('btn-next').addEventListener('click', () => {
    cleanup();
    router.navigate('/play', { duration, category, punctuation, voiceMode });
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    cleanup();
    router.navigate('/play', { duration, category, punctuation, voiceMode, textId });
  });

  // Challenge Friend button handler
  document.getElementById('btn-challenge').addEventListener('click', () => {
    const username = storage.getUsername() || 'Friend';
    const challengeId = storage.saveChallenge({ text, wpm, accuracy, duration, username });
    const url = `${window.location.origin}${window.location.pathname}#/play?challenge=${challengeId}`;

    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('btn-challenge');
      btn.textContent = '✅ Link Copied!';
      setTimeout(() => { btn.textContent = '🔗 Challenge Friend'; }, 2500);
    });
  });

  document.getElementById('btn-history').addEventListener('click', () => {
    cleanup();
    router.navigate('/history');
  });

  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      cleanup();
      router.navigate('/');
    });
  }

  document.getElementById('btn-share').addEventListener('click', async () => {
    const shareBtn = document.getElementById('btn-share');
    shareBtn.textContent = '⏳ Generating...';
    shareBtn.disabled = true;

    const result = generateResultCard({
      wpm: Math.round(wpm),
      accuracy: parseFloat(accuracy.toFixed(1)),
      consistency: parseFloat(consistency.toFixed(1)),
      duration,
      rank: rank.name
    });

    await result.share();

    shareBtn.textContent = '📤 Share Result';
    shareBtn.disabled = false;
  });

  // Auto-focus "Next Test" button
  requestAnimationFrame(() => {
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.focus();
  });

  // ── Keyboard Shortcuts ──
  let tabPressed = false;
  let tabTimeout = null;

  const keyHandler = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      tabPressed = true;
      clearTimeout(tabTimeout);
      tabTimeout = setTimeout(() => { tabPressed = false; }, 1000);
      return;
    }
    if (e.key === 'Enter' && tabPressed) {
      e.preventDefault();
      cleanup();
      router.navigate('/play', { duration, category, punctuation, voiceMode });
      return;
    }
    if (e.key === 'Escape') {
      cleanup();
      router.navigate('/');
      return;
    }
  };

  document.addEventListener('keydown', keyHandler);

  // ── Cleanup ──
  function cleanup() {
    document.removeEventListener('keydown', keyHandler);
    clearTimeout(tabTimeout);
  }

  return cleanup;
}
