import { renderNavbar } from '../components/navbar.js';
import { socket } from '../lib/socket.js';

/**
 * Render multi-player match results with full ranked leaderboard (1st - 4th places).
 */
export function renderMatchResult(appEl, router) {
  const state = router.getState() || {};
  const allResults = state.allResults || [];
  const roomCode = state.roomCode || '';
  const duration = state.duration ?? 30;

  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  const io = socket.get();

  // Find my entry
  const myEntry = allResults.find(r => r.socketId === io.id);
  const myRank = myEntry ? myEntry.rank : allResults.length;

  let outcomeLabel = 'MATCH COMPLETE';
  let outcomeClass = 'outcome-draw';

  if (myRank === 1) {
    outcomeLabel = '🥇 VICTORY!';
    outcomeClass = 'outcome-win';
  } else if (myRank === 2) {
    outcomeLabel = '🥈 2nd PLACE';
    outcomeClass = 'outcome-draw';
  } else if (myRank === 3) {
    outcomeLabel = '🥉 3rd PLACE';
    outcomeClass = 'outcome-lose';
  } else if (myRank >= 4) {
    outcomeLabel = '4th PLACE';
    outcomeClass = 'outcome-lose';
  }

  const container = document.createElement('div');
  container.className = 'match-result-container';

  container.innerHTML = `
    <div class="match-outcome ${outcomeClass}">
      <span class="outcome-text">${outcomeLabel}</span>
    </div>

    <!-- Ranked Leaderboard -->
    <div class="match-leaderboard card-glass">
      <h3 class="leaderboard-title">🏆 Match Standings</h3>
      <div class="leaderboard-list">
        ${allResults.map((r, index) => {
          const isMe = r.socketId === io.id;
          const medals = ['🥇', '🥈', '🥉', '4️⃣'];
          const medal = medals[r.rank - 1] || `${r.rank}.`;

          return `
            <div class="leaderboard-item ${isMe ? 'is-me' : ''} ${r.rank === 1 ? 'rank-1' : ''}">
              <div class="rank-badge">${medal}</div>
              <div class="player-info">
                <span class="player-name">${escapeHtml(r.username)} ${isMe ? '<small>(You)</small>' : ''}</span>
              </div>
              <div class="player-stats">
                <span class="wpm-stat">${Math.round(r.wpm)} <small>WPM</small></span>
                <span class="acc-stat">${parseFloat((r.accuracy || 0).toFixed(1))}% ACC</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="match-actions">
      <button class="btn btn-primary" id="btn-rematch">🔄 Rematch</button>
      <button class="btn btn-secondary" id="btn-new-match">New Match</button>
      <button class="btn btn-ghost" id="btn-home">Home</button>
    </div>

    <!-- Rematch status overlays -->
    <div class="rematch-status" id="rematch-status" style="display: none;"></div>
    <div class="rematch-invite" id="rematch-invite" style="display: none;">
      <p>🔄 Rematch requested!</p>
      <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
        <button class="btn btn-primary" id="btn-accept-rematch">Accept</button>
        <button class="btn btn-ghost" id="btn-decline-rematch">Decline</button>
      </div>
    </div>
  `;

  appEl.appendChild(container);

  const rematchStatusEl = container.querySelector('#rematch-status');
  const rematchInviteEl = container.querySelector('#rematch-invite');
  const actionsEl = container.querySelector('.match-actions');

  // Rematch button click
  const btnRematch = container.querySelector('#btn-rematch');
  if (btnRematch) {
    btnRematch.addEventListener('click', () => {
      io.emit('rematch:request', { oldRoomCode: roomCode, duration });
      btnRematch.disabled = true;
      btnRematch.textContent = '⏳ Waiting...';
      rematchStatusEl.textContent = 'Waiting for players to accept rematch...';
      rematchStatusEl.style.display = '';
    });
  }

  function onRematchWaiting() {
    rematchStatusEl.textContent = '⏳ Waiting for other players to accept...';
    rematchStatusEl.style.display = '';
  }

  function onRematchInvited({ oldRoomCode: inviteRoomCode, duration: inviteDuration }) {
    actionsEl.style.display = 'none';
    rematchInviteEl.style.display = '';

    container.querySelector('#btn-accept-rematch').onclick = () => {
      io.emit('rematch:request', { oldRoomCode: inviteRoomCode, duration: inviteDuration });
      rematchInviteEl.style.display = 'none';
      rematchStatusEl.textContent = '⏳ Joining rematch...';
      rematchStatusEl.style.display = '';
    };

    container.querySelector('#btn-decline-rematch').onclick = () => {
      actionsEl.style.display = '';
      rematchInviteEl.style.display = 'none';
    };
  }

  function onRoomStarting({ text, duration: d, roomCode: newRoomCode, players }) {
    cleanup();
    router.navigate('/battle', { text, duration: d, roomCode: newRoomCode, players });
  }

  io.on('rematch:waiting', onRematchWaiting);
  io.on('rematch:invited', onRematchInvited);
  io.on('room:starting', onRoomStarting);

  // Other buttons
  container.querySelector('#btn-new-match').addEventListener('click', () => {
    cleanup();
    router.navigate('/lobby');
  });

  container.querySelector('#btn-home').addEventListener('click', () => {
    cleanup();
    router.navigate('/');
  });

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      router.navigate('/');
    }
  };
  document.addEventListener('keydown', handleKeydown);

  function cleanup() {
    document.removeEventListener('keydown', handleKeydown);
    io.off('rematch:waiting', onRematchWaiting);
    io.off('rematch:invited', onRematchInvited);
    io.off('room:starting', onRoomStarting);
  }

  return cleanup;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
