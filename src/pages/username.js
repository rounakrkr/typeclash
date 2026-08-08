import { storage } from '../lib/storage.js';
import { normalizeCollege } from '../lib/utils.js';

/**
 * Show a fullscreen username prompt on first visit.
 * Resolves with the chosen username once confirmed by server.
 * @param {import('socket.io').Socket} io
 * @returns {Promise<string>}
 */
export function showUsernamePrompt(io) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'username-overlay';
    overlay.className = 'username-overlay';

    overlay.innerHTML = `
      <div class="username-modal card-glass">
        <div class="username-logo">
          <span class="logo-type">type</span><span class="logo-clash">clash</span>
        </div>
        <h2 class="username-title">Welcome to TypeClash</h2>
        <p class="username-subtitle">Choose a username and optionally add your college!</p>

        <div class="username-input-wrap">
          <input
            type="text"
            id="username-input"
            class="username-input"
            placeholder="Username (e.g. SpeedTyper)"
            maxlength="16"
            autocomplete="off"
            spellcheck="false"
          >
          <span class="username-counter" id="username-counter">0/16</span>
        </div>

        <div class="username-input-wrap" style="margin-top: 1rem;">
          <input
            type="text"
            id="college-input"
            class="username-input"
            style="font-size: 0.95rem;"
            placeholder="College / Univ (Optional)"
            maxlength="32"
            autocomplete="off"
            spellcheck="false"
          >
        </div>

        <p class="username-rules">Username: 3–16 characters · letters, numbers, underscores</p>
        <p class="username-error" id="username-error" style="display:none;"></p>

        <button class="btn btn-primary" id="username-submit" disabled>Let's Go →</button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const input = overlay.querySelector('#username-input');
    const collegeInput = overlay.querySelector('#college-input');
    const submitBtn = overlay.querySelector('#username-submit');
    const errorEl = overlay.querySelector('#username-error');
    const counter = overlay.querySelector('#username-counter');

    // Pre-fill existing data if available
    const existingUser = storage.getUsername() || '';
    const existingCollege = storage.getCollege() || '';
    if (existingUser) {
      input.value = existingUser;
      counter.textContent = `${existingUser.length}/16`;
      submitBtn.disabled = !/^[a-zA-Z0-9_]{3,16}$/.test(existingUser);
    }
    if (existingCollege) {
      collegeInput.value = existingCollege;
    }

    if (existingUser && !existingCollege) {
      collegeInput.focus();
    } else {
      input.focus();
    }

    const validate = (val) => /^[a-zA-Z0-9_]{3,16}$/.test(val);

    input.addEventListener('input', () => {
      const val = input.value.replace(/[^a-zA-Z0-9_]/g, '');
      input.value = val;
      counter.textContent = `${val.length}/16`;
      submitBtn.disabled = !validate(val);
      errorEl.style.display = 'none';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!collegeInput.value.trim()) {
          collegeInput.focus();
        } else if (!submitBtn.disabled) {
          submitBtn.click();
        }
      }
    });

    collegeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !submitBtn.disabled) {
        submitBtn.click();
      }
    });

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = '';
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
    }

    submitBtn.addEventListener('click', () => {
      const username = input.value.trim();
      const rawCollege = overlay.querySelector('#college-input').value.trim();
      const college = normalizeCollege(rawCollege);
      if (!validate(username)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Checking...';
      errorEl.style.display = 'none';

      // Ask server if username is available
      io.emit('username:check', { username, college });
    });

    function onUsernameOk({ username, college }) {
      storage.setUsername(username);
      if (college) storage.setCollege(college);
      io.off('username:ok', onUsernameOk);
      io.off('username:taken', onUsernameTaken);

      // Fade out
      overlay.classList.remove('visible');
      overlay.classList.add('hiding');
      setTimeout(() => {
        overlay.remove();
        resolve(username);
      }, 400);
    }

    function onUsernameTaken() {
      submitBtn.disabled = false;
      submitBtn.textContent = "Let's Go →";
      showError('That username is already taken. Try another!');
    }

    io.on('username:ok', onUsernameOk);
    io.on('username:taken', onUsernameTaken);
  });
}
