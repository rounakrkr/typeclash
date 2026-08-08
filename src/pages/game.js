import { TypingEngine } from '../engine/typing.js';
import { StatsCalculator } from '../engine/calculator.js';
import { GameTimer } from '../engine/timer.js';
import { createLiveStats } from '../components/live-stats.js';
import { getTextForDuration, getTextById } from '../data/texts.js';
import { generateRandomWords } from '../data/words.js';
import { sounds } from '../lib/sounds.js';
import { formatTime } from '../lib/utils.js';
import { tts } from '../lib/tts.js';

/**
 * Strip punctuation from text — MonkeyType style.
 * Lowercase, no special chars — just words and spaces.
 */
function stripPunctuation(text) {
  let clean = text;

  // Replace ALL special characters with spaces — keep only letters, numbers, spaces
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, ' ');

  // Lowercase everything
  clean = clean.toLowerCase();

  // Collapse multiple spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

/**
 * Split text into word-based chunks for voice mode TTS.
 * Returns array of { text, startPos, endPos, lastWordPos } objects.
 * lastWordPos = position where the last word of the chunk starts (trigger next chunk here).
 */
function splitIntoChunks(text, wordsPerChunk = 4) {
  const words = text.split(' ');
  const chunks = [];
  let charPos = 0;

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    const chunkText = chunkWords.join(' ');
    const startPos = charPos;
    const endPos = charPos + chunkText.length;

    // Find where the last word starts (after the last space in the chunk)
    const lastSpaceInChunk = chunkText.lastIndexOf(' ');
    const lastWordPos = lastSpaceInChunk >= 0
      ? startPos + lastSpaceInChunk + 1  // after the last space
      : startPos;  // single word chunk

    chunks.push({ text: chunkText, startPos, endPos, lastWordPos });

    // +1 for the space after the chunk (except at the end)
    charPos = endPos + (i + wordsPerChunk < words.length ? 1 : 0);
  }

  return chunks;
}

/**
 * Render the typing game page.
 * Returns a cleanup function for the router to call when navigating away.
 */
export function renderGame(appEl, router) {
  const state = router.getState() || {};
  const duration = state.duration ?? 30;
  const category = state.category || 'words';
  const isPractice = duration === 0;
  const voiceMode = state.voiceMode || false;
  const punctuation = state.punctuation ?? false; // Default: OFF (MonkeyType style)
  const textId = state.textId || null;
  let voiceRate = 1.0;

  // ── Get text passage ──
  let textObj;
  if (textId) {
    // Retry — use the same text
    textObj = getTextById(textId);
  }
  if (!textObj && category === 'words') {
    // MonkeyType-style random words — target enough chars for the duration
    const targetChars = isPractice ? 300 : Math.ceil((duration / 60) * 400 * 2);
    textObj = generateRandomWords(targetChars);
  } else if (!textObj) {
    textObj = getTextForDuration(isPractice ? null : duration, category);
  }
  if (!textObj) {
    textObj = getTextForDuration(null, category); // fallback
  }

  // Strip punctuation if disabled or voice mode (random words are already clean)
  const text = (category === 'words') ? textObj.text
    : (!punctuation || voiceMode) ? stripPunctuation(textObj.text) : textObj.text;


  // Voice mode: split text into chunks for paced TTS
  let voiceChunks = [];
  let currentChunkIndex = 0;
  if (voiceMode) {
    voiceChunks = splitIntoChunks(text, 4);
  }

  // ── Create stats calculator ──
  const calculator = new StatsCalculator();

  // ── Track state ──
  let timerStarted = false;
  let gameFinished = false;

  // ── Build DOM ──
  // Progress bar (thin bar at top)
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  appEl.appendChild(progressBar);

  const container = document.createElement('div');
  container.className = 'game-container' + (voiceMode ? ' voice-mode' : '');

  // Game header: Live WPM | Timer | Live Accuracy
  const header = document.createElement('div');
  header.className = 'game-header';

  const liveStats = createLiveStats();

  const timerEl = document.createElement('div');
  timerEl.className = 'timer-display';
  timerEl.id = 'timer-display';
  timerEl.textContent = isPractice ? '0:00' : formatTime(duration * 1000);

  const spacer = document.createElement('div');
  spacer.style.width = '120px'; // Balance the header layout

  header.appendChild(liveStats.element);
  header.appendChild(timerEl);
  header.appendChild(spacer);
  container.appendChild(header);

  // Text display (typing engine renders into this)
  const textDisplayEl = document.createElement('div');
  textDisplayEl.className = 'text-display';
  textDisplayEl.id = 'text-display';
  container.appendChild(textDisplayEl);

  // Voice mode: speed control
  let speedControl = null;
  if (voiceMode) {
    speedControl = document.createElement('div');
    speedControl.className = 'voice-speed-control';
    speedControl.innerHTML = `
      <div class="voice-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        </svg>
        <span>Voice Mode</span>
      </div>
      <div class="speed-pills">
        <button class="speed-pill" data-rate="0.5">0.5x</button>
        <button class="speed-pill" data-rate="0.75">0.75x</button>
        <button class="speed-pill active" data-rate="1">1x</button>
        <button class="speed-pill" data-rate="1.25">1.25x</button>
        <button class="speed-pill" data-rate="1.5">1.5x</button>
        <button class="speed-pill" data-rate="2">2x</button>
      </div>
    `;
    container.appendChild(speedControl);

    // Speed pill handlers
    speedControl.querySelectorAll('.speed-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        speedControl.querySelectorAll('.speed-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        voiceRate = parseFloat(pill.dataset.rate);
        tts.setRate(voiceRate);
      });
    });
  }

  // Game info bar (keyboard shortcuts)
  const info = document.createElement('div');
  info.className = 'game-info';
  info.innerHTML = '<kbd>Tab</kbd> + <kbd>Enter</kbd> to restart &nbsp;|&nbsp; <kbd>Esc</kbd> to go home';
  container.appendChild(info);

  // Focus warning overlay
  const focusWarning = document.createElement('div');
  focusWarning.className = 'game-focus-warning';
  focusWarning.id = 'focus-warning';
  focusWarning.textContent = 'Click here or press any key to continue typing';
  focusWarning.addEventListener('click', () => focusWarning.classList.remove('active'));
  container.appendChild(focusWarning);

  appEl.appendChild(container);

  // ── Create timer ──
  const timer = new GameTimer(isPractice ? 0 : duration * 1000, {
    onTick({ remaining, elapsed }) {
      if (gameFinished) return;

      // Update timer display
      if (isPractice) {
        timerEl.textContent = formatTime(elapsed);
      } else {
        timerEl.textContent = formatTime(remaining);
        // Pulse animation when < 5 seconds
        if (remaining < 5000 && remaining > 0) {
          timerEl.classList.add('pulse');
        } else {
          timerEl.classList.remove('pulse');
        }
      }

      // Record per-second WPM snapshot
      calculator.updatePerSecondWPM(elapsed);

      // Update live stats
      const wpm = calculator.getWPM(elapsed);
      const acc = calculator.getAccuracy();
      liveStats.updateWPM(wpm);
      liveStats.updateAccuracy(acc);

      // Update progress bar
      const progress = engine.getProgress();
      progressBar.style.width = progress.percentage + '%';
    },
    onComplete() {
      if (!gameFinished) finishGame();
    }
  });

  // ── Create typing engine ──
  const engine = new TypingEngine(textDisplayEl, text, {
    onStart() {
      // Start timer on first keystroke
      if (!timerStarted) {
        timer.start();
        timerStarted = true;
        textDisplayEl.classList.add('typing');
      }
    },
    onKeystroke({ char, position, correct, timestamp }) {
      if (gameFinished) return;

      // Feed to calculator
      calculator.addKeystroke(correct, timestamp);

      // Play sound
      if (correct) {
        sounds.playKeystroke();
      } else {
        sounds.playError();
      }

      // Update live stats immediately
      const elapsed = timer.getElapsed();
      if (elapsed > 0) {
        liveStats.updateWPM(calculator.getWPM(elapsed));
        liveStats.updateAccuracy(calculator.getAccuracy());
      }

      // Update progress bar
      const progress = engine.getProgress();
      progressBar.style.width = progress.percentage + '%';

      // Voice mode: pre-load next chunk when user reaches last word
      if (voiceMode && voiceChunks.length > 0) {
        const nextPos = position + 1;
        const chunk = voiceChunks[currentChunkIndex];
        if (chunk && nextPos >= chunk.lastWordPos && currentChunkIndex < voiceChunks.length - 1) {
          clearChunkHighlight();
          currentChunkIndex++;
          speakChunk(currentChunkIndex);
        }
      }
    },
    onComplete() {
      // User finished typing all characters
      if (!gameFinished) finishGame();
    }
  });

  // Initialize and activate engine
  engine.init();
  engine.start();

  // Voice mode: speak first chunk immediately (before user types)
  if (voiceMode && voiceChunks.length > 0) {
    speakChunk(0);
  }

  // ── Voice chunk helpers ──
  function speakChunk(index) {
    if (index >= voiceChunks.length) return;
    const chunk = voiceChunks[index];

    // Highlight the chars in this chunk
    highlightChunk(chunk);

    // Speak it
    tts.setRate(voiceRate);
    tts.speak(chunk.text);
  }

  function highlightChunk(chunk) {
    // Get all char spans from the engine
    const spans = textDisplayEl.querySelectorAll('.char');
    for (let i = chunk.startPos; i < chunk.endPos && i < spans.length; i++) {
      spans[i].classList.add('char-speaking');
    }
  }

  function clearChunkHighlight() {
    textDisplayEl.querySelectorAll('.char-speaking').forEach(el => {
      el.classList.remove('char-speaking');
    });
  }

  // ── Finish game ──
  function finishGame() {
    gameFinished = true;
    timer.stop();
    engine.stop();
    sounds.playComplete();
    if (voiceMode) tts.stop();

    const elapsed = timer.getElapsed();
    const wpm = calculator.getWPM(elapsed);
    const rawWpm = calculator.getRawWPM(elapsed);
    const accuracy = calculator.getAccuracy();
    const consistency = calculator.getConsistency();
    const charStats = calculator.getCharStats();
    const perSecondWPM = calculator.getPerSecondWPM();
    const errors = engine.getErrors();

    // Navigate to results with full stats
    cleanup();
    router.navigate('/results', {
      _fresh: true,
      wpm,
      rawWpm,
      accuracy,
      consistency,
      charStats,
      perSecondWPM,
      errors,
      duration,
      category,
      punctuation,
      voiceMode,
      elapsedMs: elapsed,
      textId: textObj.id
    });
  }

  // ── Keyboard shortcuts (Tab+Enter restart, Esc home) ──
  let tabPressed = false;
  let tabTimeout = null;

  const shortcutHandler = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      tabPressed = true;
      clearTimeout(tabTimeout);
      tabTimeout = setTimeout(() => { tabPressed = false; }, 1000);
      return;
    }

    if (e.key === 'Enter' && tabPressed) {
      e.preventDefault();
      tabPressed = false;
      // Restart with new text, same settings
      cleanup();
      router.navigate('/play', { duration, category, punctuation, voiceMode });
      return;
    }

    if (e.key === 'Escape') {
      cleanup();
      router.navigate('/');
      return;
    }
  };

  // Use capture phase so we intercept Tab/Enter before the typing engine
  document.addEventListener('keydown', shortcutHandler, true);

  // ── Focus/blur detection ──
  const onBlur = () => {
    if (engine.isActive() && timerStarted && !gameFinished) {
      focusWarning.classList.add('active');
    }
  };
  const onFocus = () => {
    focusWarning.classList.remove('active');
  };
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);

  // ── Cleanup function ──
  function cleanup() {
    engine.destroy();
    timer.stop();
    if (voiceMode) tts.stop();
    document.removeEventListener('keydown', shortcutHandler, true);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    clearTimeout(tabTimeout);
  }

  return cleanup;
}
