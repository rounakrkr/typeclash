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

    const existingUser = storage.getUsername() || '';
    const existingCollege = storage.getCollege() || '';

    overlay.innerHTML = `
      <div class="username-modal card-glass" style="position: relative;">
        ${existingUser ? `<button class="username-close-btn" id="username-close" title="Close">✕</button>` : ''}
        <div class="username-logo">
          <span class="logo-type">type</span><span class="logo-clash">clash</span>
        </div>
        <h2 class="username-title">${existingUser ? 'Edit Profile' : 'Welcome to TypeClash'}</h2>
        <p class="username-subtitle">${existingUser ? 'Update your username or college affiliation' : 'Choose a username and optionally add your college!'}</p>

        <div style="text-align: left; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
          Username
        </div>
        <div class="username-input-wrap">
          <input
            type="text"
            id="username-input"
            class="username-input"
            placeholder="e.g. SpeedTyper"
            maxlength="16"
            autocomplete="off"
            spellcheck="false"
          >
          <span class="username-counter" id="username-counter">0/16</span>
        </div>

        <div style="text-align: left; margin-top: 1rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
          College / University <small style="opacity: 0.6;">(Optional)</small>
        </div>
        <div class="username-input-wrap">
          <input
            type="text"
            id="college-input"
            class="username-input"
            style="font-size: 0.95rem;"
            placeholder="e.g. KIIT, VIT, IIT (Optional)"
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
    const closeBtn = overlay.querySelector('#username-close');

    // Pre-fill existing data if available (do not pre-fill fallback 'General')
    if (existingUser) {
      input.value = existingUser;
      counter.textContent = `${existingUser.length}/16`;
      submitBtn.disabled = !/^[a-zA-Z0-9_]{3,16}$/.test(existingUser);
    }
    if (existingCollege && existingCollege.toLowerCase() !== 'general') {
      collegeInput.value = existingCollege;
    }

    const closeModal = () => {
      document.removeEventListener('keydown', handleKeydown);
      overlay.classList.remove('visible');
      overlay.classList.add('hiding');
      setTimeout(() => {
        overlay.remove();
        resolve(existingUser || 'Guest');
      }, 300);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape' && existingUser) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeydown);

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
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

    let currentSubmittedCollege = 'General';

    submitBtn.addEventListener('click', () => {
      const username = input.value.trim();
      const rawCollege = overlay.querySelector('#college-input').value.trim();
      const college = normalizeCollege(rawCollege);
      currentSubmittedCollege = college;
      if (!validate(username)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Checking...';
      errorEl.style.display = 'none';

      // Ask server if username is available
      io.emit('username:check', { username, college });
    });

    function onUsernameOk(data = {}) {
      const username = data.username;
      const college = data.college || currentSubmittedCollege;
      storage.setUsername(username);
      storage.setCollege(college);
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
