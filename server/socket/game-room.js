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
    this.isRanked = options.isRanked || false;
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
   * @param {number} elo
   * @returns {{ id: string, socketId: string, isHost: boolean } | null}
   */
  addPlayer(socketId, username = 'Player', elo = 1200) {
    if (this.isFull()) return null;

    const playerId = `player${this.nextPlayerNum++}`;
    const isHost = this.players.size === 0;

    const playerInfo = {
      id: playerId,
      username,
      elo,
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

    // Immediately emit count = 3
    io.to(this.roomCode).emit('game:countdown', { count });
    count--;

    this.countdownTimer = setInterval(() => {
      if (count >= 0) {
        io.to(this.roomCode).emit('game:countdown', { count });
        count--;
      } else {
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

    // Ranked 1v1 Elo Calculation
    if (this.isRanked && entries.length === 2 && entries.every(e => e.finished)) {
      const p1 = entries[0];
      const p2 = entries[1];
      
      const p1Elo = this.players.get(p1.socketId).elo || 1200;
      const p2Elo = this.players.get(p2.socketId).elo || 1200;

      // Expected scores
      const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const expectedP2 = 1 / (1 + Math.pow(10, (p1Elo - p2Elo) / 400));

      // Actual scores (1 for win, 0.5 for draw, 0 for loss)
      let scoreP1 = 0.5, scoreP2 = 0.5;
      if (p1.wpm > p2.wpm) { scoreP1 = 1; scoreP2 = 0; }
      else if (p2.wpm > p1.wpm) { scoreP1 = 0; scoreP2 = 1; }

      // Performance multiplier based on WPM diff (so completely destroying someone gives more points)
      const wpmDiff = Math.abs(p1.wpm - p2.wpm);
      // K base is 32. Multiplier grows logarithmically with WPM difference.
      const kFactor = 32 * (1 + Math.log(wpmDiff + 1) / 3);

      p1.eloChange = Math.round(kFactor * (scoreP1 - expectedP1));
      p2.eloChange = Math.round(kFactor * (scoreP2 - expectedP2));

      p1.newElo = p1Elo + p1.eloChange;
      p2.newElo = p2Elo + p2.eloChange;
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
