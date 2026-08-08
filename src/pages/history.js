import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { storage } from '../lib/storage.js';
import { formatNumber } from '../lib/utils.js';

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
 * Format a date string for display.
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Format duration for display.
 */
function formatDuration(dur) {
  if (dur === 0) return 'Practice';
  return `${dur}s`;
}

/**
 * Render the history page — past tests and personal bests.
 */
export function renderHistory(appEl, router) {
  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  const history = storage.getHistory();
  const personalBests = storage.getPersonalBests();
  const testCount = storage.getTestCount();

  const container = document.createElement('div');
  container.className = 'history-container';

  // ── Hero / Page Header ──
  const header = document.createElement('div');
  header.className = 'history-header fade-in';
  header.innerHTML = `
    <h1 class="history-title">Your <span class="text-gradient">Stats</span></h1>
    <p class="history-subtitle">${testCount > 0 ? `${formatNumber(testCount)} tests completed` : 'No tests completed yet'}</p>
  `;
  container.appendChild(header);

  // ── Overview Stats (if any tests exist) ──
  if (history.length > 0) {
    const bestWpm = Math.max(...history.map(h => h.wpm));
    // Top 10 avg — sort by WPM descending, take top 10
    const top10 = [...history].sort((a, b) => b.wpm - a.wpm).slice(0, 10);
    const avgAcc = top10.reduce((sum, h) => sum + (h.accuracy || 0), 0) / top10.length;
    const avgWpm = top10.reduce((sum, h) => sum + h.wpm, 0) / top10.length;
    const bestRank = getRank(bestWpm);

    const overview = document.createElement('div');
    overview.className = 'history-overview fade-in-up';
    overview.innerHTML = `
      <div class="overview-card overview-best">
        <div class="overview-icon">🏆</div>
        <div class="overview-value">${Math.round(bestWpm)}</div>
        <div class="overview-label">Best WPM</div>
        <div class="badge ${bestRank.class}" style="margin-top: 0.5rem; font-size: 0.7rem;">${bestRank.emoji} ${bestRank.name}</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">📊</div>
        <div class="overview-value">${Math.round(avgWpm)}</div>
        <div class="overview-label">Avg WPM (Top 10)</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">🎯</div>
        <div class="overview-value">${avgAcc.toFixed(1)}%</div>
        <div class="overview-label">Avg Acc (Top 10)</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">🔥</div>
        <div class="overview-value">${formatNumber(testCount)}</div>
        <div class="overview-label">Total Tests</div>
      </div>
    `;
    container.appendChild(overview);

    // ── Personal Bests per Mode ──
    const pbEntries = Object.entries(personalBests);
    if (pbEntries.length > 0) {
      const pbSection = document.createElement('div');
      pbSection.className = 'pb-section fade-in-up';
      pbSection.innerHTML = `<h2 class="section-title">Personal Bests</h2>`;

      const pbGrid = document.createElement('div');
      pbGrid.className = 'pb-grid';

      // Sort: time modes first (by duration), then practice
      const sorted = pbEntries.sort((a, b) => {
        const durA = parseInt(a[0].split('_')[1]) || 0;
        const durB = parseInt(b[0].split('_')[1]) || 0;
        return durA - durB;
      });

      sorted.forEach(([key, wpm]) => {
        const parts = key.split('_');
        const dur = parseInt(parts[1]) || 0;
        const label = dur === 0 ? 'Practice' : `${dur}s`;
        const rank = getRank(wpm);

        const card = document.createElement('div');
        card.className = 'pb-card';
        card.innerHTML = `
          <div class="pb-mode">${label}</div>
          <div class="pb-wpm">${Math.round(wpm)}</div>
          <div class="pb-wpm-label">WPM</div>
          <div class="badge ${rank.class}" style="font-size: 0.65rem; padding: 0.15rem 0.5rem;">${rank.name}</div>
        `;
        pbGrid.appendChild(card);
      });

      pbSection.appendChild(pbGrid);
      container.appendChild(pbSection);
    }

    // ── Test History Table ──
    const historySection = document.createElement('div');
    historySection.className = 'history-section fade-in-up';
    historySection.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Recent Tests</h2>
        <button class="btn btn-ghost btn-sm" id="btn-clear-history">Clear History</button>
      </div>
    `;

    // ── Filter tabs ──
    const filterWrap = document.createElement('div');
    filterWrap.className = 'history-filters';
    filterWrap.innerHTML = `
      <button class="filter-pill active" data-filter="all">All</button>
      <button class="filter-pill" data-filter="words">Words</button>
      <button class="filter-pill" data-filter="punctuation">Punctuation</button>
      <button class="filter-pill" data-filter="plain">Plain</button>
    `;
    historySection.appendChild(filterWrap);

    const table = document.createElement('div');
    table.className = 'history-table';

    function getEntryType(entry) {
      if (entry.category === 'words') return 'words';
      if (entry.punctuation) return 'punctuation';
      return 'plain';
    }

    function getTypeBadge(entry) {
      const type = getEntryType(entry);
      if (type === 'words') return '<span class="type-badge type-words">words</span>';
      if (type === 'punctuation') return '<span class="type-badge type-punct">Aa.</span>';
      return '<span class="type-badge type-plain">plain</span>';
    }

    function renderTable(filter) {
      table.innerHTML = '';

      // Table header
      const thead = document.createElement('div');
      thead.className = 'history-row history-row-header';
      thead.innerHTML = `
        <div class="history-cell cell-num">#</div>
        <div class="history-cell cell-wpm">WPM</div>
        <div class="history-cell cell-raw">Raw</div>
        <div class="history-cell cell-acc">Accuracy</div>
        <div class="history-cell cell-con">Consistency</div>
        <div class="history-cell cell-chars">Chars</div>
        <div class="history-cell cell-type">Type</div>
        <div class="history-cell cell-mode">Mode</div>
        <div class="history-cell cell-rank">Rank</div>
        <div class="history-cell cell-date">Date</div>
      `;
      table.appendChild(thead);

      const filtered = filter === 'all'
        ? history
        : history.filter(e => getEntryType(e) === filter);

      if (filtered.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'history-empty';
        emptyRow.textContent = 'No tests in this category yet.';
        table.appendChild(emptyRow);
        return;
      }

      filtered.forEach((entry, index) => {
        const rank = getRank(entry.wpm);
        const row = document.createElement('div');
        row.className = 'history-row';
        row.style.animationDelay = `${index * 0.03}s`;

        const chars = entry.charStats
          ? `${entry.charStats.correct}/${entry.charStats.incorrect}`
          : (entry.chars || '—');

        row.innerHTML = `
          <div class="history-cell cell-num">${index + 1}</div>
          <div class="history-cell cell-wpm">${Math.round(entry.wpm)}</div>
          <div class="history-cell cell-raw">${entry.rawWpm ? Math.round(entry.rawWpm) : '—'}</div>
          <div class="history-cell cell-acc">${entry.accuracy != null ? entry.accuracy.toFixed(1) + '%' : '—'}</div>
          <div class="history-cell cell-con">${entry.consistency != null ? entry.consistency.toFixed(1) + '%' : '—'}</div>
          <div class="history-cell cell-chars">${chars}</div>
          <div class="history-cell cell-type">${getTypeBadge(entry)}</div>
          <div class="history-cell cell-mode">${formatDuration(entry.duration)}</div>
          <div class="history-cell cell-rank"><span class="badge ${rank.class}" style="font-size:0.65rem;padding:0.1rem 0.4rem;">${rank.emoji} ${rank.name}</span></div>
          <div class="history-cell cell-date">${entry.date ? formatDate(entry.date) : '—'}</div>
        `;
        table.appendChild(row);
      });
    }

    // Initial render
    renderTable('all');

    // Filter pill click handlers
    filterWrap.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        filterWrap.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable(btn.dataset.filter);
      });
    });

    historySection.appendChild(table);
    container.appendChild(historySection);

    // Clear history handler
    setTimeout(() => {
      const clearBtn = document.getElementById('btn-clear-history');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            storage.set('tc_history', []);
            storage.set('tc_test_count', 0);
            storage.set('tc_personal_bests', {});
            router.navigate('/history');
          }
        });
      }
    }, 0);

  } else {
    // ── Empty State ──
    const empty = document.createElement('div');
    empty.className = 'history-empty fade-in-up';
    empty.innerHTML = `
      <div class="empty-icon">📝</div>
      <h2>No tests yet</h2>
      <p>Complete your first typing test to see your stats here!</p>
      <button class="btn btn-primary" id="btn-start-first">Start Typing</button>
    `;
    container.appendChild(empty);

    setTimeout(() => {
      const startBtn = document.getElementById('btn-start-first');
      if (startBtn) {
        startBtn.addEventListener('click', () => router.navigate('/'));
      }
    }, 0);
  }

  appEl.appendChild(container);
  appEl.appendChild(renderFooter());

  // Keyboard shortcut
  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      router.navigate('/');
    }
  };
  document.addEventListener('keydown', keyHandler);

  function cleanup() {
    document.removeEventListener('keydown', keyHandler);
  }

  return cleanup;
}
