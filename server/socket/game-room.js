/**
 * GameRoom — manages the lifecycle of a multiplayer typing match.
 *
 * States: WAITING → COUNTDOWN → PLAYING → FINISHED
 * Capacity: up to 4 players
 * Start: host must explicitly emit room:start (min 2 players)
 */
export class GameRoom {
  constructor(roomCode, options = {}) {
    this.roomCode = roomCode;
    this.state = 'WAITING'; // WAITING | COUNTDOWN | PLAYING | FINISHED
    this.players = new Map(); // socketId → { id, username, progress, finished, results }
    this.hostSocketId = null;  // first player who creates the room
    this.text = null;
    this.duration = options.duration || 30;
    this.category = options.category || 'all';
    this.punctuation = options.punctuation || false;
    this.createdAt = Date.now();
    this.gameStartTime = null;
    this.countdownTimer = null;
    this.gameTimer = null;
    this.nextPlayerNum = 1;
  }

  // ── Player management ──────────────────────────────────────────────

  /**
   * Add a player to the room.
   * @param {string} socketId
   * @param {string} username
   * @returns {{ id: string, socketId: string, isHost: boolean } | null}
   */
  addPlayer(socketId, username = 'Player') {
    if (this.isFull()) return null;

    const playerId = `player${this.nextPlayerNum++}`;
    const isHost = this.players.size === 0;

    const playerInfo = {
      id: playerId,
      username,
      progress: { position: 0, wpm: 0, accuracy: 100, progressPct: 0 },
      finished: false,
      results: null
    };

    this.players.set(socketId, playerInfo);

    if (isHost) {
      this.hostSocketId = socketId;
    }

    return { id: playerId, socketId, isHost, username };
  }

  /**
   * Remove a player from the room.
   * @param {string} socketId
   * @returns {number} Remaining player count.
   */
  removePlayer(socketId) {
    this.players.delete(socketId);

    // If host left, transfer host to next player
    if (socketId === this.hostSocketId) {
      const next = this.players.keys().next().value;
      this.hostSocketId = next || null;
    }

    return this.players.size;
  }

  /** @returns {boolean} */
  isFull() {
    return this.players.size >= 4;
  }

  /** @returns {boolean} */
  isEmpty() {
    return this.players.size === 0;
  }

  /** @returns {boolean} */
  isHost(socketId) {
    return socketId === this.hostSocketId;
  }

  /**
   * Get all other player socket IDs (opponents).
   * @param {string} socketId
   * @returns {string[]}
   */
  getOpponents(socketId) {
    return [...this.players.keys()].filter(id => id !== socketId);
  }

  /**
   * Get opponent socket ID (backwards compat for 2-player use).
   * @param {string} socketId
   * @returns {string | null}
   */
  getOpponent(socketId) {
    return this.getOpponents(socketId)[0] || null;
  }

  /**
   * Serialize all players for broadcast.
   */
  getPlayersInfo() {
    return [...this.players.entries()].map(([sid, p]) => ({
      socketId: sid,
      playerId: p.id,
      username: p.username,
      isHost: sid === this.hostSocketId
    }));
  }

  // ── Game flow ──────────────────────────────────────────────────────

  /**
   * Start the 3-2-1 countdown, then transition to PLAYING.
   * @param {import('socket.io').Server} io
   */
  startCountdown(io) {
    this.state = 'COUNTDOWN';
    let count = 3;

    this.countdownTimer = setInterval(() => {
      io.to(this.roomCode).emit('game:countdown', { count });
      count--;

      if (count < 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.startGame(io);
      }
    }, 1000);
  }

  /**
   * Transition to PLAYING and start the game timer.
   * @param {import('socket.io').Server} io
   */
  startGame(io) {
    this.state = 'PLAYING';
    this.gameStartTime = Date.now();

    io.to(this.roomCode).emit('game:start', {
      startTime: this.gameStartTime,
      duration: this.duration
    });

    this.gameTimer = setTimeout(() => {
      this.timeUp(io);
    }, this.duration * 1000);
  }

  /**
   * Called when the game timer expires.
   * @param {import('socket.io').Server} io
   */
  timeUp(io) {
    if (this.state === 'FINISHED') return;

    this.state = 'FINISHED';
    this.gameTimer = null;

    const allResults = this.getAllResults();
    // Send personalized results to each player
    for (const [sid, player] of this.players) {
      const myEntry = allResults.find(r => r.socketId === sid);
      io.to(sid).emit('game:over', {
        reason: 'time',
        myPlayerId: player.id,
        allResults,
        rank: myEntry ? myEntry.rank : allResults.length
      });
    }
  }

  // ── Progress & results ─────────────────────────────────────────────

  /**
   * Update a player's live progress.
   */
  updateProgress(socketId, data) {
    const player = this.players.get(socketId);
    if (!player) return;

    player.progress = {
      position: data.position ?? player.progress.position,
      wpm: data.wpm ?? player.progress.wpm,
      accuracy: data.accuracy ?? player.progress.accuracy,
      progressPct: data.progress ?? player.progress.progressPct
    };
  }

  /**
   * Mark a player as finished and record their results.
   */
  playerFinished(socketId, results) {
    const player = this.players.get(socketId);
    if (!player) return;

    player.finished = true;
    player.results = {
      ...results,
      finishTime: Date.now()
    };
  }

  /**
   * Check if ALL players have finished.
   */
  isGameOver() {
    if (this.state === 'FINISHED') return true;
    for (const [, player] of this.players) {
      if (!player.finished) return false;
    }
    return true;
  }

  /**
   * Get ranked results for all players (sorted by WPM desc, then accuracy).
   * @returns {Array}
   */
  getAllResults() {
    const entries = [];

    for (const [socketId, player] of this.players) {
      const stats = player.results || player.progress;
      entries.push({
        socketId,
        playerId: player.id,
        username: player.username,
        wpm: stats.wpm ?? 0,
        rawWpm: stats.rawWpm ?? 0,
        accuracy: stats.accuracy ?? 0,
        consistency: stats.consistency ?? 0,
        charStats: stats.charStats ?? null,
        finished: player.finished
      });
    }

    // Sort: by WPM desc, then accuracy desc
    entries.sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return b.accuracy - a.accuracy;
    });

    // Assign ranks (ties get same rank)
    let rank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].wpm === entries[i - 1].wpm && entries[i].accuracy === entries[i - 1].accuracy) {
        entries[i].rank = entries[i - 1].rank; // same rank for tie
      } else {
        entries[i].rank = rank;
      }
      rank++;
    }

    return entries;
  }

  // ── Cleanup ────────────────────────────────────────────────────────

  /** Clear all running timers. */
  cleanup() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }
}
