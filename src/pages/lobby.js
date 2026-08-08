import { renderNavbar } from '../components/navbar.js';
import { socket } from '../lib/socket.js';
import { storage } from '../lib/storage.js';

/**
 * Render the multiplayer lobby page.
 * Up to 4 players can join. Host starts the game when ready (min 2 players).
 */
export function renderLobby(appEl, router) {
  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  let currentDuration = 30;
  let isWaiting = false;
  let roomCode = '';
  let isHost = false;
  let players = [];

  const io = socket.get();
  const username = storage.getUsername() || 'Player';

  const container = document.createElement('div');
  container.className = 'lobby-container';

  container.innerHTML = `
    <h2 class="lobby-title">⚔️ Battle Arena</h2>
    <p class="lobby-subtitle">Playing as <strong>${escapeHtml(username)}</strong></p>

    <!-- Create / Join Actions -->
    <div class="lobby-actions" id="lobby-actions">
      <!-- Create Room Card -->
      <div class="lobby-card card-glass">
        <h3>Create Room</h3>
        <p>Start a 4-player room and invite friends</p>
        <div class="duration-pills" id="lobby-duration">
          <button class="pill" data-dur="15">15s</button>
          <button class="pill active" data-dur="30">30s</button>
          <button class="pill" data-dur="60">60s</button>
        </div>
        <button class="btn btn-primary" id="btn-create">Create Room</button>
      </div>

      <!-- Join Room Card -->
      <div class="lobby-card card-glass">
        <h3>Join Room</h3>
        <p>Enter a 4-character room code</p>
        <input type="text" id="room-code-input" class="room-code-input"
               placeholder="ABCD" maxlength="4" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" id="btn-join">Join Room</button>
      </div>
    </div>

    <!-- Waiting Room State (hidden by default) -->
    <div class="waiting-state card-glass" id="waiting-state" style="display: none;">
      <div class="room-header">
        <div class="room-code-display">
          <span class="room-code-label">ROOM CODE</span>
          <span class="room-code" id="room-code-value">----</span>
          <button class="btn btn-ghost" id="btn-copy">📋 Copy</button>
        </div>
        <span class="player-count-badge" id="player-count-badge">1/4 Players</span>
      </div>

      <div class="lobby-players-list" id="players-list">
        <!-- Dynamically rendered player cards -->
      </div>

      <div class="host-controls" id="host-controls">
        <button class="btn btn-primary btn-start-game" id="btn-start" disabled>
          🚀 Start Game
        </button>
        <p class="host-hint" id="start-hint">Waiting for at least 1 more player to join...</p>
      </div>

      <div class="guest-waiting-hint" id="guest-hint" style="display: none;">
        <div class="pulse-dot"></div>
        <span>Waiting for host to start the game...</span>
      </div>

      <button class="btn btn-ghost btn-leave-room" id="btn-cancel">Leave Room</button>
    </div>

    <!-- Error message -->
    <div class="lobby-error" id="lobby-error" style="display: none;"></div>
  `;

  appEl.appendChild(container);

  // ── DOM refs ──
  const actionsEl = container.querySelector('#lobby-actions');
  const waitingEl = container.querySelector('#waiting-state');
  const roomCodeValue = container.querySelector('#room-code-value');
  const playerCountBadge = container.querySelector('#player-count-badge');
  const playersListEl = container.querySelector('#players-list');
  const hostControls = container.querySelector('#host-controls');
  const guestHint = container.querySelector('#guest-hint');
  const startBtn = container.querySelector('#btn-start');
  const startHint = container.querySelector('#start-hint');
  const errorEl = container.querySelector('#lobby-error');
  const codeInput = container.querySelector('#room-code-input');

  // ── Duration pills ──
  const pills = container.querySelectorAll('#lobby-duration .pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentDuration = parseInt(pill.dataset.dur, 10);
    });
  });

  // Auto-uppercase room code
  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  // ── Create Room ──
  container.querySelector('#btn-create').addEventListener('click', () => {
    hideError();
    io.emit('room:create', { duration: currentDuration });
  });

  // ── Join Room ──
  container.querySelector('#btn-join').addEventListener('click', () => {
    const code = codeInput.value.trim();
    if (!code || code.length < 4) {
      showError('Please enter a 4-character room code.');
      return;
    }
    hideError();
    io.emit('room:join', { roomCode: code });
  });

  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') container.querySelector('#btn-join').click();
  });

  // ── Start Game (Host only) ──
  startBtn.addEventListener('click', () => {
    if (!isHost || players.length < 2) return;
    startBtn.disabled = true;
    startBtn.textContent = '⏳ Starting...';
    io.emit('room:start');
  });

  // ── Copy Code ──
  container.querySelector('#btn-copy').addEventListener('click', () => {
    const code = roomCodeValue.textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = container.querySelector('#btn-copy');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  });

  // ── Leave Room ──
  container.querySelector('#btn-cancel').addEventListener('click', () => {
    io.emit('room:leave');
    isWaiting = false;
    showActions();
  });

  // ── Socket Listeners ──
  function onRoomCreated({ roomCode: code, players: plist }) {
    roomCode = code;
    isHost = true;
    players = plist || [];
    showWaiting();
    renderPlayerList();
  }

  function onRoomJoined({ roomCode: code, isHost: hostFlag, players: plist }) {
    roomCode = code;
    isHost = hostFlag;
    players = plist || [];
    showWaiting();
    renderPlayerList();
  }

  function onPlayerJoined({ players: plist }) {
    players = plist || [];
    renderPlayerList();
  }

  function onPlayerLeft({ players: plist, newHostSocketId }) {
    players = plist || [];
    if (newHostSocketId === socket.id) {
      isHost = true;
    }
    renderPlayerList();
  }

  function onRoomStarting({ text, duration, players: finalPlayers }) {
    isWaiting = false;
    cleanup();
    router.navigate('/battle', { text, duration, roomCode, players: finalPlayers, isHost });
  }

  function onError({ message }) {
    showActions();
    showError(message || 'Something went wrong.');
  }

  io.on('room:created', onRoomCreated);
  io.on('room:you_joined', onRoomJoined);
  io.on('room:player_joined', onPlayerJoined);
  io.on('room:player_left', onPlayerLeft);
  io.on('room:starting', onRoomStarting);
  io.on('room:error', onError);

  // ── UI Renderers ──
  function renderPlayerList() {
    playerCountBadge.textContent = `${players.length}/4 Players`;
    playersListEl.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const p = players[i];
      const card = document.createElement('div');
      card.className = `lobby-player-slot ${p ? 'filled' : 'empty'}`;

      if (p) {
        const isMe = p.socketId === socket.id;
        card.innerHTML = `
          <div class="player-avatar">${p.username.charAt(0).toUpperCase()}</div>
          <div class="player-details">
            <span class="player-name-text">${escapeHtml(p.username)} ${isMe ? '<small>(You)</small>' : ''}</span>
            ${p.isHost ? '<span class="host-badge">👑 HOST</span>' : '<span class="ready-badge">READY</span>'}
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="player-avatar empty-avatar">+</div>
          <div class="player-details">
            <span class="player-name-text empty-text">Waiting for player...</span>
          </div>
        `;
      }
      playersListEl.appendChild(card);
    }

    // Host vs Guest controls
    if (isHost) {
      hostControls.style.display = '';
      guestHint.style.display = 'none';

      if (players.length >= 2) {
        startBtn.disabled = false;
        startHint.textContent = `Ready! Press Start Game (${players.length}/4 players)`;
      } else {
        startBtn.disabled = true;
        startHint.textContent = 'Waiting for at least 1 more player to join...';
      }
    } else {
      hostControls.style.display = 'none';
      guestHint.style.display = '';
    }
  }

  function showWaiting() {
    isWaiting = true;
    actionsEl.style.display = 'none';
    waitingEl.style.display = '';
    roomCodeValue.textContent = roomCode;
  }

  function showActions() {
    actionsEl.style.display = '';
    waitingEl.style.display = 'none';
    hideError();
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = '';
  }

  function hideError() {
    errorEl.style.display = 'none';
  }

  function cleanup() {
    io.off('room:created', onRoomCreated);
    io.off('room:you_joined', onRoomJoined);
    io.off('room:player_joined', onPlayerJoined);
    io.off('room:player_left', onPlayerLeft);
    io.off('room:starting', onRoomStarting);
    io.off('room:error', onError);
  }

  return () => {
    if (isWaiting) {
      io.emit('room:leave');
    }
    cleanup();
  };
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
