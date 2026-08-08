import { renderNavbar } from '../components/navbar.js';
import { socket } from '../lib/socket.js';

/**
 * Render the head-to-head match result page.
 * Compares player vs opponent stats and shows win/lose/draw outcome.
 * Rematch: emits rematch:request to server, opponent gets notified automatically.
 */
export function renderMatchResult(appEl, router) {
  const state = router.getState() || {};
  const player = state.player || {};
  const opponent = state.opponent; // null if opponent disconnected
  const roomCode = state.roomCode || '';
  const duration = state.duration ?? 30;

  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  // ── Determine outcome ──
  let outcome = 'draw';
  let outcomeLabel = 'DRAW';

  if (!opponent) {
    outcome = 'win';
    outcomeLabel = 'OPPONENT LEFT';
  } else if (player.wpm > opponent.wpm) {
    outcome = 'win';
    outcomeLabel = 'YOU WIN!';
  } else if (player.wpm < opponent.wpm) {
    outcome = 'lose';
    outcomeLabel = 'DEFEAT';
  } else {
    if (player.accuracy > opponent.accuracy) {
      outcome = 'win';
      outcomeLabel = 'YOU WIN!';
    } else if (player.accuracy < opponent.accuracy) {
      outcome = 'lose';
      outcomeLabel = 'DEFEAT';
    }
  }

  const container = document.createElement('div');
  container.className = 'match-result-container';

  const outcomeClass = outcome === 'win' ? 'outcome-win' : outcome === 'lose' ? 'outcome-lose' : 'outcome-draw';

  container.innerHTML = `
    <div class="match-outcome ${outcomeClass}">
      <span class="outcome-text">${outcomeLabel}</span>
    </div>

    <div class="match-comparison">
      <div class="comparison-player ${outcome === 'win' || outcome === 'draw' ? 'winner' : 'loser'}">
        <h3>You</h3>
        <div class="big-stat">${Math.round(player.wpm || 0)} <small style="font-size: 0.4em; opacity: 0.6;">WPM</small></div>
        <div class="stat-row">Accuracy: <strong>${parseFloat((player.accuracy || 0).toFixed(1))}%</strong></div>
        <div class="stat-row">Consistency: <strong>${parseFloat((player.consistency || 0).toFixed(1))}%</strong></div>
      </div>

      <div class="vs-divider">VS</div>

      <div class="comparison-player ${outcome === 'lose' ? 'winner' : 'loser'}">
        <h3>Opponent</h3>
        ${opponent ? `
          <div class="big-stat">${Math.round(opponent.wpm || 0)} <small style="font-size: 0.4em; opacity: 0.6;">WPM</small></div>
          <div class="stat-row">Accuracy: <strong>${parseFloat((opponent.accuracy || 0).toFixed(1))}%</strong></div>
          <div class="stat-row">Consistency: <strong>${parseFloat((opponent.consistency || 0).toFixed(1))}%</strong></div>
        ` : `
          <div class="big-stat" style="font-size: 1.5rem; color: var(--text-secondary);">Disconnected</div>
        `}
      </div>
    </div>

    <div class="match-actions">
      ${opponent ? `<button class="btn btn-primary" id="btn-rematch">🔄 Rematch</button>` : ''}
      <button class="btn btn-secondary" id="btn-new-match">New Match</button>
      <button class="btn btn-ghost" id="btn-home">Home</button>
    </div>

    <!-- Rematch states (hidden by default) -->
    <div class="rematch-status" id="rematch-status" style="display: none;"></div>
    <div class="rematch-invite" id="rematch-invite" style="display: none;">
      <p>🔄 Opponent wants a rematch!</p>
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

  // ── Rematch request ──
  const btnRematch = container.querySelector('#btn-rematch');
  if (btnRematch) {
    btnRematch.addEventListener('click', () => {
      const io = socket.get();
      io.emit('rematch:request', { oldRoomCode: roomCode, duration });
      btnRematch.disabled = true;
      btnRematch.textContent = '⏳ Waiting...';
      rematchStatusEl.textContent = 'Waiting for opponent to accept...';
      rematchStatusEl.style.display = '';
    });
  }

  // ── Rematch: server says waiting (first requester) ──
  const io = socket.get();

  function onRematchWaiting({ newRoomCode }) {
    rematchStatusEl.textContent = '⏳ Waiting for opponent to accept rematch...';
    rematchStatusEl.style.display = '';
  }

  // ── Rematch: server invited opponent ──
  function onRematchInvited({ oldRoomCode: inviteRoomCode, duration: inviteDuration }) {
    // Show invite UI
    actionsEl.style.display = 'none';
    rematchInviteEl.style.display = '';

    container.querySelector('#btn-accept-rematch').addEventListener('click', () => {
      io.emit('rematch:request', { oldRoomCode: inviteRoomCode, duration: inviteDuration });
      rematchInviteEl.style.display = 'none';
      rematchStatusEl.textContent = '⏳ Joining rematch...';
      rematchStatusEl.style.display = '';
    });

    container.querySelector('#btn-decline-rematch').addEventListener('click', () => {
      actionsEl.style.display = '';
      rematchInviteEl.style.display = 'none';
    });
  }

  // ── Navigate to battle when room:joined fires (rematch ready) ──
  function onRoomJoined({ text, duration: d, roomCode: newRoomCode }) {
    cleanup();
    router.navigate('/battle', { text, duration: d, roomCode: newRoomCode });
  }

  io.on('rematch:waiting', onRematchWaiting);
  io.on('rematch:invited', onRematchInvited);
  io.on('room:joined', onRoomJoined);

  // ── Other buttons ──
  container.querySelector('#btn-new-match').addEventListener('click', () => {
    cleanup();
    router.navigate('/lobby');
  });

  container.querySelector('#btn-home').addEventListener('click', () => {
    cleanup();
    router.navigate('/');
  });

  // ── Keyboard shortcuts ──
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
    io.off('room:joined', onRoomJoined);
  }

  return cleanup;
}
