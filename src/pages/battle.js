import { TypingEngine } from '../engine/typing.js';
import { StatsCalculator } from '../engine/calculator.js';
import { GameTimer } from '../engine/timer.js';
import { createLiveStats } from '../components/live-stats.js';
import { sounds } from '../lib/sounds.js';
import { socket } from '../lib/socket.js';
import { formatTime } from '../lib/utils.js';

/**
 * Render the multiplayer battle page (up to 4 players).
 */
export function renderBattle(appEl, router) {
  const state = router.getState() || {};
  const text = state.text || '';
  const duration = state.duration ?? 30;
  const roomCode = state.roomCode || '';
  const initialPlayers = state.players || [];

  if (!text) {
    router.navigate('/lobby');
    return;
  }

  appEl.innerHTML = '';

  const io = socket.get();
  const calculator = new StatsCalculator();

  let playerDone = false;
  let navigatedAway = false;

  // ── Countdown Overlay ──
  const countdownOverlay = document.createElement('div');
  countdownOverlay.className = 'countdown-overlay';
  countdownOverlay.id = 'countdown-overlay';

  const countdownNumber = document.createElement('div');
  countdownNumber.className = 'countdown-number';
  countdownNumber.id = 'countdown-number';
  countdownNumber.textContent = 'GET READY';
  countdownOverlay.appendChild(countdownNumber);
  appEl.appendChild(countdownOverlay);

  // ── Main Battle Container ──
  const container = document.createElement('div');
  container.className = 'battle-container';

  // ── Multi-player Progress Header ──
  const playersHeader = document.createElement('div');
  playersHeader.className = 'battle-players-grid';
  playersHeader.id = 'players-grid';

  container.appendChild(playersHeader);

  // Build tracks map: socketId → { barFill, wpmEl, statusEl }
  const playerTracks = new Map();

  function renderPlayersGrid(playersList) {
    playersHeader.innerHTML = '';
    playerTracks.clear();

    playersList.forEach(p => {
      const isMe = p.socketId === socket.id;
      const track = document.createElement('div');
      track.className = `player-track ${isMe ? 'self-track' : 'opponent-track'}`;
      track.dataset.sid = p.socketId;

      track.innerHTML = `
        <div class="track-info">
          <span class="track-username">${escapeHtml(p.username)} ${isMe ? '<small>(You)</small>' : ''}</span>
          <span class="track-wpm" id="wpm-${p.socketId}">0 WPM</span>
        </div>
        <div class="track-bar-wrap">
          <div class="track-bar-fill" id="bar-${p.socketId}" style="width: 0%;"></div>
        </div>
      `;

      playersHeader.appendChild(track);

      playerTracks.set(p.socketId, {
        bar: track.querySelector(`#bar-${p.socketId}`),
        wpm: track.querySelector(`#wpm-${p.socketId}`)
      });
    });
  }

  renderPlayersGrid(initialPlayers);

  // ── Game Header: Live Stats | Timer ──
  const header = document.createElement('div');
  header.className = 'game-header';

  const liveStats = createLiveStats();

  const timerEl = document.createElement('div');
  timerEl.className = 'timer-display';
  timerEl.textContent = formatTime(duration * 1000);

  const spacer = document.createElement('div');
  spacer.style.width = '120px';

  header.appendChild(liveStats.element);
  header.appendChild(timerEl);
  header.appendChild(spacer);
  container.appendChild(header);

  // ── Text Display ──
  const textDisplayEl = document.createElement('div');
  textDisplayEl.className = 'text-display';
  textDisplayEl.id = 'text-display';
  container.appendChild(textDisplayEl);

  // ── Game Info ──
  const info = document.createElement('div');
  info.className = 'game-info';
  info.innerHTML = `Room <strong>${roomCode}</strong> &nbsp;|&nbsp; <kbd>Esc</kbd> to forfeit`;
  container.appendChild(info);

  appEl.appendChild(container);

  // ── Create Timer ──
  const timer = new GameTimer(duration * 1000, {
    onTick({ remaining, elapsed }) {
      if (playerDone) return;

      timerEl.textContent = formatTime(remaining);
      if (remaining < 5000 && remaining > 0) {
        timerEl.classList.add('pulse');
      } else {
        timerEl.classList.remove('pulse');
      }

      calculator.updatePerSecondWPM(elapsed);

      const wpm = calculator.getWPM(elapsed);
      const acc = calculator.getAccuracy();
      liveStats.updateWPM(wpm);
      liveStats.updateAccuracy(acc);

      // Update self track
      const myTrack = playerTracks.get(socket.id);
      if (myTrack) {
        myTrack.wpm.textContent = `${wpm} WPM`;
        myTrack.bar.style.width = engine.getProgress().percentage + '%';
      }
    },
    onComplete() {}
  });

  // ── Create Typing Engine ──
  const engine = new TypingEngine(textDisplayEl, text, {
    onStart() {},
    onKeystroke({ char, position, correct, timestamp }) {
      if (playerDone) return;

      calculator.addKeystroke(correct, timestamp);
      if (correct) {
        sounds.playKeystroke();
      } else {
        sounds.playError();
      }

      const elapsed = timer.getElapsed();
      if (elapsed > 0) {
        const wpm = calculator.getWPM(elapsed);
        const acc = calculator.getAccuracy();
        liveStats.updateWPM(wpm);
        liveStats.updateAccuracy(acc);
      }

      const progress = engine.getProgress();

      // Update self track
      const myTrack = playerTracks.get(socket.id);
      if (myTrack) {
        myTrack.bar.style.width = progress.percentage + '%';
        myTrack.wpm.textContent = `${calculator.getWPM(timer.getElapsed())} WPM`;
      }

      // Emit progress to server for broadcast to opponents
      io.emit('player:keystroke', {
        position,
        wpm: calculator.getWPM(timer.getElapsed()),
        accuracy: calculator.getAccuracy(),
        progress: progress.percentage
      });
    },
    onComplete() {
      if (!playerDone) {
        finishGame();
      }
    }
  });

  // ── Countdown Handler ──
  function onCountdown({ count }) {
    sounds.playCountdown();
    if (count > 0) {
      countdownNumber.textContent = count;
      countdownNumber.classList.remove('bounce');
      void countdownNumber.offsetWidth;
      countdownNumber.classList.add('bounce');
    } else {
      countdownNumber.textContent = 'GO!';
      countdownNumber.classList.remove('bounce');
      void countdownNumber.offsetWidth;
      countdownNumber.classList.add('bounce');
    }
  }

  // ── Start Handler ──
  function onGameStart() {
    countdownOverlay.classList.add('hidden');
    setTimeout(() => { countdownOverlay.style.display = 'none'; }, 300);

    engine.start();
    timer.start();
    textDisplayEl.classList.add('typing');
  }

  // ── Opponent Progress Handler ──
  function onOpponentProgress({ socketId, wpm, progress }) {
    const track = playerTracks.get(socketId);
    if (track) {
      track.wpm.textContent = `${wpm || 0} WPM`;
      track.bar.style.width = (progress || 0) + '%';
    }
  }

  // ── Opponent Finished Handler ──
  function onOpponentFinished({ socketId, wpm }) {
    const track = playerTracks.get(socketId);
    if (track) {
      track.wpm.textContent = `✅ ${wpm} WPM`;
      track.bar.style.width = '100%';
    }
  }

  // ── Game Over Handler ──
  function onGameOver({ allResults, myPlayerId, reason }) {
    if (!navigatedAway) {
      navigatedAway = true;
      playerDone = true;
      timer.stop();
      engine.stop();
      sounds.playComplete();

      cleanup();
      router.navigate('/match-result', {
        _fresh: true,
        allResults: allResults || [],
        myPlayerId,
        roomCode,
        duration,
        reason
      });
    }
  }

  function onPlayerLeft({ players: updatedPlayers }) {
    renderPlayersGrid(updatedPlayers);
  }

  io.on('game:countdown', onCountdown);
  io.on('game:start', onGameStart);
  io.on('opponent:progress', onOpponentProgress);
  io.on('opponent:finished', onOpponentFinished);
  io.on('room:player_left', onPlayerLeft);
  io.on('game:over', onGameOver);

  // ── Finish Game ──
  function finishGame() {
    playerDone = true;
    engine.stop();
    sounds.playComplete();

    const elapsed = timer.getElapsed();
    const wpm = calculator.getWPM(elapsed);
    const rawWpm = calculator.getRawWPM(elapsed);
    const accuracy = calculator.getAccuracy();
    const consistency = calculator.getConsistency();
    const charStats = calculator.getCharStats();

    io.emit('player:finish', {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: parseFloat(accuracy.toFixed(1)),
      consistency: parseFloat(consistency.toFixed(1)),
      charStats
    });

    timerEl.textContent = 'Done!';
    timerEl.classList.remove('pulse');
  }

  // ── Keyboard Shortcuts ──
  const shortcutHandler = (e) => {
    if (e.key === 'Escape') {
      io.emit('room:leave');
      cleanup();
      router.navigate('/lobby');
    }
  };
  document.addEventListener('keydown', shortcutHandler, true);

  // ── Cleanup ──
  function cleanup() {
    engine.destroy();
    timer.stop();
    document.removeEventListener('keydown', shortcutHandler, true);
    io.off('game:countdown', onCountdown);
    io.off('game:start', onGameStart);
    io.off('opponent:progress', onOpponentProgress);
    io.off('opponent:finished', onOpponentFinished);
    io.off('room:player_left', onPlayerLeft);
    io.off('game:over', onGameOver);
  }

  return cleanup;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
