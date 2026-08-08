import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderModeSelector } from '../components/mode-selector.js';
import { storage } from '../lib/storage.js';
import { isMobile, formatNumber } from '../lib/utils.js';
import { tts } from '../lib/tts.js';

/**
 * Render the home/landing page.
 * On mobile, shows a "use desktop" message. On desktop, shows the full experience.
 */
export function renderHome(appEl, router) {
  appEl.innerHTML = '';

  // Mobile check — show clean landing instead of broken typing UI
  if (isMobile()) {
    renderMobileLanding(appEl);
    return;
  }

  // Navbar
  appEl.appendChild(renderNavbar());

  // Load saved settings
  const settings = storage.getSettings();
  let currentDuration = settings.duration ?? 30;
  let currentCategory = 'words';

  const testCount = storage.getTestCount();

  // Container
  const container = document.createElement('div');
  container.className = 'home-container';

  container.innerHTML = `
    <div class="hero">
      <div class="hero-logo">
        <span class="logo-type">type</span><span class="logo-clash">clash</span>
      </div>
      <div class="hero-tagline fade-in">Prove you're the fastest typist</div>
    </div>

    <div class="quick-start" id="quick-start">
      <div id="mode-selector-slot"></div>

      <div class="category-selector" id="category-selector">
        <button class="category-pill active" data-cat="words">Words</button>
        <button class="category-pill" data-cat="quotes">Quotes</button>
        <button class="category-pill" data-cat="literature">Literature</button>
        <button class="category-pill" data-cat="code">Code</button>
        <button class="category-pill" data-cat="tech">Tech</button>
      </div>

      <div class="mode-toggles" id="mode-toggles">
        <button class="mode-toggle-btn" id="punctuation-toggle" title="Toggle punctuation & capitalization">
          <span class="toggle-icon">Aa.</span>
          <span>Punctuation</span>
        </button>
        <button class="mode-toggle-btn" id="voice-toggle" title="Voice Dictation Mode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>Voice</span>
        </button>
      </div>

      <div class="home-actions">
        <button class="btn btn-primary" id="start-btn">Start Typing</button>
      </div>
      <div class="hint-text">or press <kbd>Enter</kbd> to start</div>
    </div>

    <div class="feature-cards">
      <div class="feature-card card-glass" id="matchmaking-card" style="cursor:pointer;">
        <div class="feature-icon">⚔️</div>
        <h3>Real-time Battles</h3>
        <p>1v1 Ranked Matchmaking</p>
      </div>
      <div class="feature-card card-glass" id="rankings-card" style="cursor:pointer;">
        <div class="feature-icon">🏆</div>
        <h3>Global Rankings</h3>
        <p>College & World Top</p>
      </div>
      <div class="feature-card card-glass" id="challenge-card" style="cursor:pointer;">
        <div class="feature-icon">🎮</div>
        <h3>Challenge Friends</h3>
        <p>Custom Room & Code</p>
      </div>
    </div>

    ${testCount > 0 ? `<div class="stats-counter">${formatNumber(testCount)} test${testCount !== 1 ? 's' : ''} completed on this device</div>` : ''}
  `;

  // Insert mode selector component
  const modeSlot = container.querySelector('#mode-selector-slot');
  const modeSelector = renderModeSelector(currentDuration, (dur) => {
    currentDuration = dur;
    storage.saveSettings({ duration: dur });
  });
  modeSlot.appendChild(modeSelector);

  // Punctuation toggle (default: OFF — MonkeyType style)
  let punctuation = false;
  const punctuationBtn = container.querySelector('#punctuation-toggle');
  punctuationBtn.addEventListener('click', () => {
    punctuation = !punctuation;
    punctuationBtn.classList.toggle('active', punctuation);
  });

  // Voice mode toggle
  let voiceMode = false;
  const voiceBtn = container.querySelector('#voice-toggle');
  if (tts.isSupported()) {
    tts.init();
    voiceBtn.addEventListener('click', () => {
      voiceMode = !voiceMode;
      voiceBtn.classList.toggle('active', voiceMode);
    });
  } else {
    voiceBtn.style.display = 'none';
  }

  // Category selector
  const catBtns = container.querySelectorAll('.category-pill');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;

      // Strict Rule for Code Category:
      // Auto-enable Punctuation, auto-disable & lock Voice Mode
      if (currentCategory === 'code') {
        punctuation = true;
        punctuationBtn.classList.add('active');

        voiceMode = false;
        voiceBtn.classList.remove('active');
        voiceBtn.style.opacity = '0.35';
        voiceBtn.style.pointerEvents = 'none';
        voiceBtn.title = 'Voice mode is disabled for Code';
      } else {
        voiceBtn.style.opacity = '1';
        voiceBtn.style.pointerEvents = 'auto';
        voiceBtn.title = 'Toggle keystroke sounds & narration';
      }
    });
  });

  // Start typing
  const start = () => {
    router.navigate('/play', { duration: currentDuration, category: currentCategory, voiceMode, punctuation });
  };

  container.querySelector('#start-btn').addEventListener('click', start);

  // Rankings card
  const rankingsCard = container.querySelector('#rankings-card');
  if (rankingsCard) {
    rankingsCard.addEventListener('click', () => {
      router.navigate('/leaderboard');
    });
  }

  // Real-time Matchmaking card (1v1)
  const matchmakingCard = container.querySelector('#matchmaking-card');
  if (matchmakingCard) {
    matchmakingCard.addEventListener('click', () => {
      router.navigate('/matchmaking');
    });
  }

  // Challenge Friends card (Custom Room & Code)
  const challengeCard = container.querySelector('#challenge-card');
  if (challengeCard) {
    challengeCard.addEventListener('click', () => {
      router.navigate('/lobby');
    });
  }

  // Enter key to start
  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      start();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  appEl.appendChild(container);
  appEl.appendChild(renderFooter());

  // Return cleanup function (router calls this when leaving page)
  return () => {
    document.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Mobile landing page — clean message asking user to open on desktop.
 */
function renderMobileLanding(appEl) {
  const container = document.createElement('div');
  container.className = 'mobile-landing';
  container.innerHTML = `
    <div class="hero-logo">
      <span class="logo-type">type</span><span class="logo-clash">clash</span>
    </div>
    <div class="mobile-message">
      <p class="mobile-title">Best experienced on desktop</p>
      <p class="mobile-subtitle">TypeClash needs a physical keyboard for the best experience. Open this link on your laptop or desktop computer.</p>
    </div>
    <button class="btn btn-primary" id="copy-link-btn">📋 Copy Link</button>
  `;

  container.querySelector('#copy-link-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const btn = container.querySelector('#copy-link-btn');
      btn.textContent = '✅ Link Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy Link'; }, 2000);
    });
  });

  appEl.appendChild(container);
}
