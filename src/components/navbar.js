import { sounds } from '../lib/sounds.js';

/**
 * Render the fixed top navigation bar.
 * Shows a back button on all pages except home.
 */
export function renderNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar';

  const isHome = !window.location.hash || window.location.hash === '#/' || window.location.hash === '#';

  nav.innerHTML = `
    <div class="nav-left flex-center gap-md">
      ${!isHome ? `
        <button class="btn-icon nav-back" id="nav-back" aria-label="Go back" title="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
      ` : ''}
      <a href="#/" class="logo" id="nav-logo">
        <span class="logo-type">type</span><span class="logo-clash">clash</span>
      </a>
    </div>
    <div class="nav-controls flex-center gap-md">
      <a href="#/history" class="nav-link" id="nav-history" title="View your stats & history">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8v4l3 3"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span class="nav-link-text">History</span>
      </a>
      <button class="btn-icon settings-toggle" id="sound-toggle" aria-label="Toggle sound" title="Toggle keystroke sounds">
        ${sounds.isEnabled() ? '🔊' : '🔇'}
      </button>
    </div>
  `;

  // Back button handler — directly navigate to main home page (#/)
  const backBtn = nav.querySelector('#nav-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/';
    });
  }

  // Sound toggle handler
  const soundToggle = nav.querySelector('#sound-toggle');
  soundToggle.addEventListener('click', () => {
    const newState = !sounds.isEnabled();
    sounds.setEnabled(newState);
    soundToggle.textContent = newState ? '🔊' : '🔇';
  });

  return nav;
}
