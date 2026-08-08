import { renderNavbar } from '../components/navbar.js';
import { socket } from '../lib/socket.js';
import { storage } from '../lib/storage.js';

export function renderMatchmaking(appEl, router) {
  appEl.innerHTML = '';
  appEl.appendChild(renderNavbar());

  const container = document.createElement('div');
  container.className = 'matchmaking-container';

  const currentElo = storage.getElo();

  container.innerHTML = `
    <div class="matchmaking-box card-glass">
      <div class="radar">
        <div class="radar-pulse"></div>
        <div class="radar-pulse" style="animation-delay: 0.5s"></div>
        <div class="radar-dot"></div>
      </div>
      <h2 style="margin-top: 2rem;">Finding Opponent...</h2>
      <p style="color: var(--text-secondary);">Searching for a worthy challenger</p>
      <div class="matchmaking-stats" style="margin-top: 1rem;">
        <div class="stat-badge">Your Rating: <strong>${currentElo}</strong></div>
      </div>
      <button class="btn btn-secondary cancel-btn" id="cancel-matchmaking" style="margin-top: 2rem;">Cancel Search</button>
    </div>
  `;

  appEl.appendChild(container);

  let searchTimerVal = 0;
  const searchTimerEl = document.createElement('p');
  searchTimerEl.style.cssText = 'color: var(--text-secondary); margin-top: 0.5rem; font-family: monospace; font-size: 0.9rem;';
  searchTimerEl.textContent = 'Searching time: 0s';

  const box = container.querySelector('.matchmaking-box');
  const statsEl = container.querySelector('.matchmaking-stats');
  if (statsEl) {
    statsEl.appendChild(searchTimerEl);
  }

  const io = socket.connect();
  let matched = false;
  let activeRoomCode = null;

  const timerInterval = setInterval(() => {
    if (matched) {
      clearInterval(timerInterval);
      return;
    }
    searchTimerVal++;
    searchTimerEl.textContent = `Searching time: ${searchTimerVal}s`;

    // Show Bot Option after 4s
    if (searchTimerVal >= 4 && !container.querySelector('#btn-bot-match')) {
      const botBtn = document.createElement('button');
      botBtn.id = 'btn-bot-match';
      botBtn.className = 'btn btn-secondary';
      botBtn.style.marginTop = '1rem';
      botBtn.innerHTML = '🤖 Challenge AI Bot (Instant Match)';
      botBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        io.emit('matchmaking:request_bot');
      });
      const cancelBtn = container.querySelector('#cancel-matchmaking');
      if (cancelBtn) {
        box.insertBefore(botBtn, cancelBtn);
      }
    }

    // Auto-match with Bot after 9s if still waiting alone
    if (searchTimerVal >= 9 && !matched) {
      clearInterval(timerInterval);
      io.emit('matchmaking:request_bot');
    }
  }, 1000);

  // Ensure we have a username before queueing
  if (!storage.getUsername()) {
    clearInterval(timerInterval);
    router.navigate('/');
    return;
  }

  // Join the queue
  io.emit('matchmaking:join', { elo: currentElo });

  // Handle Match Found
  const onMatchmakingFound = ({ roomCode }) => {
    matched = true;
    clearInterval(timerInterval);
    activeRoomCode = roomCode;
    if (box) {
      box.innerHTML = `
        <div class="matchmaking-success">
          <div class="feature-icon" style="font-size: 3rem; margin-bottom: 1rem;">⚔️</div>
          <h2>Match Found!</h2>
          <p>Entering the arena...</p>
        </div>
      `;
    }
  };

  const onRoomStarting = (data) => {
    if (!matched || !activeRoomCode) return;
    clearInterval(timerInterval);
    const { text, duration, players, isRanked, botSocketId } = data;
    router.navigate('/battle', { roomCode: activeRoomCode, duration, text, players, isRanked, botSocketId });
  };

  io.on('matchmaking:found', onMatchmakingFound);
  io.on('room:starting', onRoomStarting);

  // Handle Cancel
  const cancelBtn = container.querySelector('#cancel-matchmaking');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      io.emit('matchmaking:leave');
      router.navigate('/');
    });
  }

  // Cleanup on leave
  return () => {
    clearInterval(timerInterval);
    if (!matched) {
      io.emit('matchmaking:leave');
    }
    io.off('matchmaking:found', onMatchmakingFound);
    io.off('room:starting', onRoomStarting);
  };
}
