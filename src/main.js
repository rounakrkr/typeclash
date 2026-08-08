/**
 * TypeClash — App Entry Point
 * Bootstraps the SPA router, initializes theme and sound systems.
 */

// CSS imports (processed by Vite)
import './styles/index.css';
import './styles/components.css';
import './styles/home.css';
import './styles/game.css';
import './styles/results.css';
import './styles/history.css';
import './styles/lobby.css';
import './styles/battle.css';

// Core modules
import { Router } from './lib/router.js';
import { theme } from './lib/theme.js';
import { sounds } from './lib/sounds.js';
import { tts } from './lib/tts.js';
import { storage } from './lib/storage.js';
import { socket } from './lib/socket.js';

// Page renderers
import { renderHome } from './pages/home.js';
import { renderGame } from './pages/game.js';
import { renderResults } from './pages/results.js';
import { renderHistory } from './pages/history.js';
import { renderLobby } from './pages/lobby.js';
import { renderBattle } from './pages/battle.js';
import { renderMatchResult } from './pages/match-result.js';
import { showUsernamePrompt } from './pages/username.js';

// Initialize theme
theme.init();

// Initialize sounds (lazy — AudioContext created on first user interaction)
sounds.init();

// Initialize TTS (preload voices)
tts.init();

// Get app mount point
const app = document.getElementById('app');

// Create router
const router = new Router(app);

// Register routes
router.addRoute('/', (params, state) => renderHome(app, router));
router.addRoute('/play', (params, state) => renderGame(app, router));
router.addRoute('/results', (params, state) => renderResults(app, router));
router.addRoute('/history', (params, state) => renderHistory(app, router));
router.addRoute('/lobby', (params, state) => renderLobby(app, router));
router.addRoute('/battle', (params, state) => renderBattle(app, router));
router.addRoute('/match-result', (params, state) => renderMatchResult(app, router));

// ── Username check on first visit ──
async function boot() {
  const io = socket.get();

  // If no username stored, show prompt before starting router
  if (!storage.getUsername()) {
    if (!io.connected) {
      await Promise.race([
        new Promise(resolve => io.once('connect', resolve)),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
    }
    await showUsernamePrompt(io);
  }

  // Register reconnect listener for ALL users
  io.on('connect', () => {
    const name = storage.getUsername();
    if (name) {
      io.emit('username:register', { username: name });
    }
  });

  if (io.connected && storage.getUsername()) {
    io.emit('username:register', { username: storage.getUsername() });
  }

  // Start routing
  router.init();
}

boot();
