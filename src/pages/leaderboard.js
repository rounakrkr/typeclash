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
  const io = socket.get();

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
          <tr>
            <th style="width: 70px;">Rank</th>
            <th>Player</th>
            <th>College / Univ</th>
            <th>WPM</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody id="rank-table-body">
          <!-- Dynamically populated -->
        </tbody>
      </table>
    </div>
  `;

  appEl.appendChild(container);

  const tbody = container.querySelector('#rank-table-body');
  const tabs = container.querySelectorAll('.tab-btn');

  let currentTab = 'global';

  // Seed sample leaderboard data
  const sampleGlobal = [
    { rank: 1, username: 'SpeedDemon', college: 'KIIT University', wpm: 142, elo: 2150 },
    { rank: 2, username: 'HyperType', college: 'IIT Bombay', wpm: 138, elo: 2080 },
    { rank: 3, username: 'KeyboardGod', college: 'BITS Pilani', wpm: 135, elo: 2010 },
    { rank: 4, username: 'NinjaKeys', college: 'VIT Vellore', wpm: 129, elo: 1940 },
    { rank: 5, username: 'Rounak_AI', college: 'KIIT University', wpm: 124, elo: 1880 },
    { rank: 6, username: 'ByteRacer', college: 'IIT Delhi', wpm: 118, elo: 1810 },
    { rank: 7, username: 'SwiftHands', college: 'SRM Chennai', wpm: 112, elo: 1750 },
    { rank: 8, username: myUsername, college: myCollege, wpm: 88, elo: 1250, isMe: true }
  ];

  const sampleCollege = [
    { rank: 1, username: 'KIIT University', college: 'Bhubaneswar', wpm: 118, elo: 1850, players: 42 },
    { rank: 2, username: 'IIT Bombay', college: 'Mumbai', wpm: 115, elo: 1820, players: 38 },
    { rank: 3, username: 'BITS Pilani', college: 'Pilani', wpm: 112, elo: 1790, players: 29 },
    { rank: 4, username: 'VIT Vellore', college: 'Vellore', wpm: 108, elo: 1730, players: 35 },
    { rank: 5, username: 'SRM Chennai', college: 'Chennai', wpm: 102, elo: 1680, players: 21 }
  ];

  const sampleWeekly = [
    { rank: 1, username: 'LightningFast', college: 'KIIT University', wpm: 145, elo: '15s Mode' },
    { rank: 2, username: 'SpeedDemon', college: 'KIIT University', wpm: 140, elo: '30s Mode' },
    { rank: 3, username: 'HyperType', college: 'IIT Bombay', wpm: 136, elo: '60s Mode' },
    { rank: 4, username: myUsername, college: myCollege, wpm: 88, elo: '30s Mode', isMe: true }
  ];

  function renderTable(data, tab) {
    const thead = container.querySelector('thead tr');
    if (tab === 'global') {
      thead.innerHTML = `
        <th style="width: 70px;">Rank</th>
        <th>Player</th>
        <th>College / Univ</th>
        <th>WPM</th>
        <th>Rating</th>
      `;
    } else if (tab === 'college') {
      thead.innerHTML = `
        <th style="width: 70px;">Rank</th>
        <th>College Name</th>
        <th>City / Branch</th>
        <th>Avg WPM</th>
        <th>Total Rating</th>
      `;
    } else {
      thead.innerHTML = `
        <th style="width: 70px;">Rank</th>
        <th>Player</th>
        <th>College / Univ</th>
        <th>WPM</th>
        <th>Game Mode</th>
      `;
    }

    tbody.innerHTML = '';
    data.forEach(item => {
      const tr = document.createElement('tr');
      if (item.isMe) tr.className = 'is-me-row';
      if (item.rank === 1) tr.className = (tr.className + ' top-rank-1').trim();

      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[item.rank - 1] || `#${item.rank}`;

      tr.innerHTML = `
        <td class="rank-cell">${medal}</td>
        <td class="player-cell">
          <strong>${escapeHtml(item.username)}</strong>
          ${item.isMe ? '<span class="you-tag">(You)</span>' : ''}
        </td>
        <td><span class="college-badge">${escapeHtml(item.college)}</span></td>
        <td class="wpm-cell">${item.wpm} <small>WPM</small></td>
        <td class="elo-cell">${item.elo}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  renderTable(sampleGlobal, 'global');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      if (currentTab === 'global') renderTable(sampleGlobal, 'global');
      else if (currentTab === 'college') renderTable(sampleCollege, 'college');
      else if (currentTab === 'weekly') renderTable(sampleWeekly, 'weekly');
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
