import { renderNavbar } from '../components/navbar.js';
import { storage } from '../lib/storage.js';
import { socket } from '../lib/socket.js';

/**
 * Render the Rankings & Leaderboard page (Global, College, Weekly).
 */
export function renderLeaderboard(appEl, router) {
  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  const myUsername = storage.getUsername() || 'Guest';
  const myCollege = storage.getCollege() || 'General';
  const myElo = storage.getElo() || 1200;
  const history = storage.getHistory() || [];
  const myBestWpm = history.length > 0 ? Math.max(...history.map(h => h.wpm || 0)) : 88;

  const container = document.createElement('div');
  container.className = 'leaderboard-container';

  container.innerHTML = `
    <div class="leaderboard-header">
      <h2 class="leaderboard-page-title">🏆 Global Rankings</h2>
      <p class="leaderboard-page-subtitle">Climb the ranks and represent your university</p>
    </div>

    <!-- Tabs -->
    <div class="leaderboard-tabs">
      <button class="tab-btn active" data-tab="global">🌍 Global Top</button>
      <button class="tab-btn" data-tab="college">🎓 College Standings</button>
      <button class="tab-btn" data-tab="weekly">⚡ Weekly Speed</button>
    </div>

    <!-- Leaderboard Table Card -->
    <div class="leaderboard-card card-glass">
      <table class="rank-table" id="rank-table">
        <thead>
          <!-- Dynamically populated -->
        </thead>
        <tbody id="rank-table-body">
          <!-- Dynamically populated -->
        </tbody>
      </table>
    </div>
  `;

  appEl.appendChild(container);

  const tbody = container.querySelector('#rank-table-body');
  const thead = container.querySelector('thead');
  const tabs = container.querySelectorAll('.tab-btn');

  let currentTab = 'global';

  // Synchronized global top data
  const sampleGlobal = [
    { rank: 1, username: 'SpeedDemon', college: 'KIIT University', wpm: 142, elo: 2150 },
    { rank: 2, username: 'HyperType', college: 'IIT Bombay', wpm: 138, elo: 2080 },
    { rank: 3, username: 'KeyboardGod', college: 'BITS Pilani', wpm: 135, elo: 2010 },
    { rank: 4, username: 'NinjaKeys', college: 'VIT Vellore', wpm: 129, elo: 1940 },
    { rank: 5, username: 'ByteRacer', college: 'IIT Delhi', wpm: 118, elo: 1810 },
    { rank: 6, username: 'SwiftHands', college: 'SRM University', wpm: 112, elo: 1750 },
    { rank: 7, username: myUsername, college: myCollege, wpm: myBestWpm, elo: myElo, isMe: true }
  ];

  // College standings data with realistic stats
  const sampleCollege = [
    { rank: 1, name: 'KIIT University', city: 'Bhubaneswar', typists: 42, avgWpm: 128, totalElo: 2450 },
    { rank: 2, name: 'IIT Bombay', city: 'Mumbai', typists: 38, avgWpm: 122, totalElo: 2280 },
    { rank: 3, name: 'BITS Pilani', city: 'Pilani', typists: 29, avgWpm: 118, totalElo: 2150 },
    { rank: 4, name: 'VIT Vellore', city: 'Vellore', typists: 35, avgWpm: 114, totalElo: 2010 },
    { rank: 5, name: 'SRM University', city: 'Chennai', typists: 21, avgWpm: 108, totalElo: 1890 }
  ];

  // Weekly speed matching the global top players
  const sampleWeekly = [
    { rank: 1, username: 'SpeedDemon', college: 'KIIT University', wpm: 142, mode: '30s Mode' },
    { rank: 2, username: 'HyperType', college: 'IIT Bombay', wpm: 138, mode: '60s Mode' },
    { rank: 3, username: 'KeyboardGod', college: 'BITS Pilani', wpm: 135, mode: '15s Mode' },
    { rank: 4, username: 'NinjaKeys', college: 'VIT Vellore', wpm: 129, mode: '30s Mode' },
    { rank: 5, username: myUsername, college: myCollege, wpm: myBestWpm, mode: '60s Mode', isMe: true }
  ];

  function renderTable(tab) {
    if (tab === 'global') {
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Rank</th>
          <th>Player</th>
          <th>College / Univ</th>
          <th>WPM</th>
          <th>Rating</th>
        </tr>
      `;
      tbody.innerHTML = sampleGlobal.map(item => `
        <tr class="${item.isMe ? 'is-me-row' : ''} ${item.rank === 1 ? 'top-rank-1' : ''}">
          <td class="rank-cell">${getMedal(item.rank)}</td>
          <td class="player-cell">
            <strong>${escapeHtml(item.username)}</strong>
            ${item.isMe ? '<span class="you-tag">(You)</span>' : ''}
          </td>
          <td><span class="college-badge">${escapeHtml(item.college)}</span></td>
          <td class="wpm-cell">${item.wpm} <small>WPM</small></td>
          <td class="elo-cell">${item.elo}</td>
        </tr>
      `).join('');
    } else if (tab === 'college') {
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Rank</th>
          <th>College Name</th>
          <th>City</th>
          <th>Active Typists</th>
          <th>Avg WPM</th>
          <th>Total Rating</th>
        </tr>
      `;
      tbody.innerHTML = sampleCollege.map(item => {
        const isMyCollege = myCollege && myCollege.toLowerCase() === item.name.toLowerCase();
        return `
          <tr class="${isMyCollege ? 'is-me-row' : ''} ${item.rank === 1 ? 'top-rank-1' : ''}">
            <td class="rank-cell">${getMedal(item.rank)}</td>
            <td class="player-cell">
              <strong>${escapeHtml(item.name)}</strong>
              ${isMyCollege ? '<span class="you-tag">(Your Univ)</span>' : ''}
            </td>
            <td style="color: var(--text-secondary);">${escapeHtml(item.city)}</td>
            <td>${item.typists} typists</td>
            <td class="wpm-cell">${item.avgWpm} <small>WPM</small></td>
            <td class="elo-cell">${item.totalElo}</td>
          </tr>
        `;
      }).join('');
    } else if (tab === 'weekly') {
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Rank</th>
          <th>Player</th>
          <th>College / Univ</th>
          <th>Best WPM</th>
          <th>Game Mode</th>
        </tr>
      `;
      tbody.innerHTML = sampleWeekly.map(item => `
        <tr class="${item.isMe ? 'is-me-row' : ''} ${item.rank === 1 ? 'top-rank-1' : ''}">
          <td class="rank-cell">${getMedal(item.rank)}</td>
          <td class="player-cell">
            <strong>${escapeHtml(item.username)}</strong>
            ${item.isMe ? '<span class="you-tag">(You)</span>' : ''}
          </td>
          <td><span class="college-badge">${escapeHtml(item.college)}</span></td>
          <td class="wpm-cell">${item.wpm} <small>WPM</small></td>
          <td style="color: var(--text-secondary); font-weight: 500;">${item.mode}</td>
        </tr>
      `).join('');
    }
  }

  function getMedal(rank) {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[rank - 1] || `#${rank}`;
  }

  renderTable('global');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderTable(currentTab);
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
