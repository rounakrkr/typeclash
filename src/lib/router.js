/**
 * TypeClash — Lightweight hash-based SPA Router
 * Routes: '/' (home), '/play' (game), '/results' (results)
 */
export class Router {
  constructor(appElement) {
    this.appElement = appElement;
    this.routes = new Map();
    this.state = null;
    this._cleanup = null;

    this.handleHashChange = this.handleHashChange.bind(this);
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to a route, optionally passing state data.
   * @param {string} path - Route path (e.g., '/play')
   * @param {object|null} state - State to pass to the route handler
   */
  navigate(path, state = null) {
    this.state = state;
    window.location.hash = '#' + path;
  }

  getState() {
    return this.state;
  }

  getCurrentPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return '/';
    // Strip leading '#' → '#/play' becomes '/play'
    return hash.slice(1);
  }

  init() {
    window.addEventListener('hashchange', this.handleHashChange);
    this.handleHashChange();
  }

  handleHashChange() {
    // Clean up previous route (remove event listeners, timers, etc.)
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    const path = this.getCurrentPath();
    const handler = this.routes.get(path) || this.routes.get('/');

    if (handler) {
      this.appElement.innerHTML = '';
      const cleanup = handler(null, this.state);
      if (typeof cleanup === 'function') {
        this._cleanup = cleanup;
      }
    }
  }
}
