import { renderNavbar } from '../components/navbar.js';
import { socket } from '../lib/socket.js';

/**
 * Render the multiplayer lobby page.
 * Create or join a room, wait for opponent, then navigate to battle.
 */
export function renderLobby(appEl, router) {
  appEl.innerHTML = '';

  // Navbar
  appEl.appendChild(renderNavbar());

  // State
  let currentDuration = 30;
  let isWaiting = false;
  const io = socket.get();

  // Container
  const container = document.createElement('div');
  container.className = 'lobby-container';

  container.innerHTML = `
    <h2 class="lobby-title">⚔️ Battle Arena</h2>
    <p class="lobby-subtitle">Challenge a friend to a typing duel</p>

    <div class="lobby-actions" id="lobby-actions">
      <!-- Create Room Card -->
      <div class="lobby-card card-glass">
        <h3>Create Room</h3>
        <p>Start a room and share the code</p>
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
        <p>Enter your friend's room code</p>
        <input type="text" id="room-code-input" class="room-code-input"
               placeholder="ABCD" maxlength="4" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" id="btn-join">Join Room</button>
      </div>
    </div>

    <!-- Waiting State (hidden by default) -->
    <div class="waiting-state" id="waiting-state" style="display: none;">
      <div class="room-code-display">
        <span class="room-code-label">Room Code</span>
        <span class="room-code" id="room-code-value">----</span>
        <button class="btn btn-ghost" id="btn-copy">📋 Copy</button>
      </div>
      <div class="waiting-animation">
        <div class="pulse-dot"></div>
        <span>Waiting for opponent...</span>
      </div>
      <button class="btn btn-ghost" id="btn-cancel">Cancel</button>
    </div>

    <!-- Error message -->
    <div class="lobby-error" id="lobby-error" style="display: none;"></div>
  `;

  appEl.appendChild(container);

  // ── DOM refs ──
  const actionsEl = container.querySelector('#lobby-actions');
  const waitingEl = container.querySelector('#waiting-state');
  const roomCodeValue = container.querySelector('#room-code-value');
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

  // ── Room code input: auto-uppercase ──
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

  // Enter key to join
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      container.querySelector('#btn-join').click();
    }
  });

  // ── Copy button ──
  container.querySelector('#btn-copy').addEventListener('click', () => {
    const code = roomCodeValue.textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = container.querySelector('#btn-copy');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  });

  // ── Cancel waiting ──
  container.querySelector('#btn-cancel').addEventListener('click', () => {
    io.emit('room:leave');
    showActions();
  });

  // ── Socket listeners ──
  function onRoomCreated({ roomCode }) {
    showWaiting(roomCode);
  }

  function onRoomJoined({ text, duration, roomCode }) {
    // Both players are in — navigate to battle
    // Clear waiting flag so cleanup doesn't emit room:leave (which would remove us from the room!)
    isWaiting = false;
    router.navigate('/battle', { text, duration, roomCode });
  }

  function onRoomError({ message }) {
    showActions();
    showError(message || 'Something went wrong.');
  }

  io.on('room:created', onRoomCreated);
  io.on('room:joined', onRoomJoined);
  io.on('room:error', onRoomError);

  // ── UI Helpers ──
  function showWaiting(code) {
    isWaiting = true;
    actionsEl.style.display = 'none';
    waitingEl.style.display = '';
    roomCodeValue.textContent = code;
  }

  function showActions() {
    isWaiting = false;
    actionsEl.style.display = '';
    waitingEl.style.display = 'none';
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = '';
  }

  function hideError() {
    errorEl.style.display = 'none';
  }

  // ── Cleanup ──
  return () => {
    io.off('room:created', onRoomCreated);
    io.off('room:joined', onRoomJoined);
    io.off('room:error', onRoomError);
    if (isWaiting) {
      io.emit('room:leave');
    }
  };
}
