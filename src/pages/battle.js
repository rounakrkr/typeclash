import { TypingEngine } from '../engine/typing.js';
import { StatsCalculator } from '../engine/calculator.js';
import { GameTimer } from '../engine/timer.js';
import { createLiveStats } from '../components/live-stats.js';
import { sounds } from '../lib/sounds.js';
import { socket } from '../lib/socket.js';
import { formatTime } from '../lib/utils.js';

/**
 * Render the multiplayer battle page.
 * Similar to game.js but with opponent tracking, countdown, and socket sync.
 */
export function renderBattle(appEl, router) {
  const state = router.getState() || {};
  const text = state.text || '';
  const duration = state.duration ?? 30;
  const roomCode = state.roomCode || '';

  if (!text) {
    router.navigate('/lobby');
    return;
  }

  appEl.innerHTML = '';

  const io = socket.get();
  const calculator = new StatsCalculator();

  let timerStarted = false;
  let playerDone = false;    // This player finished typing or time ran out
  let navigatedAway = false; // Server sent game:over, navigating to results
  let countdownActive = true;

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

  // ── Progress Bar ──
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  appEl.appendChild(progressBar);

  // ── Battle Container ──
  const container = document.createElement('div');
  container.className = 'battle-container';

  // ── Player Bars ──
  const playersEl = document.createElement('div');
  playersEl.className = 'battle-players';
  playersEl.innerHTML = `
    <div class="player-bar player-self">
      <span class="player-name">You</span>
      <span class="player-wpm" id="self-wpm">0 WPM</span>
    </div>
    <div class="player-bar player-opponent">
      <span class="player-name">Opponent</span>
      <span class="player-wpm" id="opponent-wpm">0 WPM</span>
    </div>
  `;
  container.appendChild(playersEl);

  const selfWpmEl = playersEl.querySelector('#self-wpm');
  const opponentWpmEl = playersEl.querySelector('#opponent-wpm');

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

  // ── Opponent Progress Bar ──
  const opponentProgressWrap = document.createElement('div');
  opponentProgressWrap.className = 'opponent-progress';
  opponentProgressWrap.innerHTML = `<div class="opponent-progress-fill" id="opponent-progress"></div>`;
  container.appendChild(opponentProgressWrap);
  const opponentProgressFill = opponentProgressWrap.querySelector('#opponent-progress');

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
      selfWpmEl.textContent = `${wpm} WPM`;

      const progress = engine.getProgress();
      progressBar.style.width = progress.percentage + '%';
    },
    onComplete() {
      // In multiplayer, server timer controls game end — text is pre-loaded for full duration
    }
  });

  // ── Create Typing Engine ──
  const engine = new TypingEngine(textDisplayEl, text, {
    onStart() {
      // Timer is started by server signal, not first keystroke in battle mode
    },
    onKeystroke({ char, position, correct, timestamp }) {
      if (playerDone) return;

      calculator.addKeystroke(correct, timestamp);

      if (correct) {
        sounds.playKeystroke();
      } else {
        sounds.playError();
      }

      // Update live stats
      const elapsed = timer.getElapsed();
      if (elapsed > 0) {
        const wpm = calculator.getWPM(elapsed);
        const acc = calculator.getAccuracy();
        liveStats.updateWPM(wpm);
        liveStats.updateAccuracy(acc);
        selfWpmEl.textContent = `${wpm} WPM`;
      }

      const progress = engine.getProgress();
      progressBar.style.width = progress.percentage + '%';

      // Emit progress to opponent
      io.emit('player:keystroke', {
        position,
        wpm: calculator.getWPM(timer.getElapsed()),
        accuracy: calculator.getAccuracy(),
        progress: progress.percentage
      });
    },
    onComplete() {
      // Player typed all text — send stats to server, stop input
      // Timer keeps running until server ends game for both players
      if (!playerDone) {
        finishGame();
      }
    }
  });

  // Initialize engine but don't start until countdown finishes
  engine.init();

  // ── Socket: Countdown & Game Start ──
  function onCountdown({ count }) {
    countdownNumber.textContent = count === 0 ? 'GO!' : count;
    // Re-trigger animation by forcing reflow
    countdownNumber.style.animation = 'none';
    countdownNumber.offsetHeight; // force reflow
    countdownNumber.style.animation = '';
  }

  function onGameStart() {
    countdownActive = false;
    // Hide overlay
    countdownOverlay.classList.add('hidden');
    setTimeout(() => { countdownOverlay.style.display = 'none'; }, 300);

    // Start engine and timer
    engine.start();
    timer.start();
    timerStarted = true;
    textDisplayEl.classList.add('typing');
  }

  function onOpponentProgress({ wpm, accuracy, progress }) {
    opponentWpmEl.textContent = `${wpm || 0} WPM`;
    opponentProgressFill.style.width = (progress || 0) + '%';
  }

  function onGameOver({ player: playerResults, opponent: opponentResults, winner }) {
    if (!navigatedAway) {
      navigatedAway = true;
      playerDone = true;
      timer.stop();
      engine.stop();
      sounds.playComplete();

      cleanup();
      router.navigate('/match-result', {
        _fresh: true,
        player: playerResults,
        opponent: opponentResults,
        winner,
        roomCode,
        duration
      });
    }
  }

  function onOpponentDisconnect() {
    if (!navigatedAway) {
      navigatedAway = true;
      playerDone = true;
      timer.stop();
      engine.stop();

      const elapsed = timer.getElapsed();
      const playerResults = {
        wpm: Math.round(calculator.getWPM(elapsed)),
        rawWpm: Math.round(calculator.getRawWPM(elapsed)),
        accuracy: parseFloat(calculator.getAccuracy().toFixed(1)),
        consistency: parseFloat(calculator.getConsistency().toFixed(1))
      };

      cleanup();
      router.navigate('/match-result', {
        _fresh: true,
        player: playerResults,
        opponent: null,
        roomCode,
        duration
      });
    }
  }

  io.on('game:countdown', onCountdown);
  io.on('game:start', onGameStart);
  io.on('opponent:progress', onOpponentProgress);
  io.on('game:over', onGameOver);
  io.on('opponent:disconnected', onOpponentDisconnect);

  // ── Finish Game (player done — wait for server game:over) ──
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

    // Show waiting message — timer keeps running until server ends game
    timerEl.textContent = 'Done!';
    timerEl.classList.remove('pulse');
    // Server will send 'game:over' when both done or time expires
  }

  // ── Keyboard Shortcuts ──
  const shortcutHandler = (e) => {
    if (e.key === 'Escape') {
      // Forfeit — leave the room and go back to lobby
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
    io.off('game:over', onGameOver);
    io.off('opponent:disconnected', onOpponentDisconnect);
  }

  return cleanup;
}
