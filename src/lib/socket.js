import { io } from 'socket.io-client';

/**
 * Socket.io client wrapper.
 * Handles dev/prod URL resolution and provides a singleton-ish interface.
 */

// In dev, Vite runs on 5173/5174, server on 3001
// In prod, both on same origin
const SERVER_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:3001`
  : undefined; // same origin in production

export const socket = {
  /** @type {import('socket.io-client').Socket | null} */
  instance: null,

  /**
   * Connect to the server. Returns the socket instance.
   * No-ops if already connected.
   */
  connect() {
    if (this.instance?.connected) return this.instance;
    this.instance = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    return this.instance;
  },

  /**
   * Disconnect and destroy the socket instance.
   */
  disconnect() {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  },

  /**
   * Get the current socket, connecting if necessary.
   */
  get() {
    return this.instance || this.connect();
  }
};
