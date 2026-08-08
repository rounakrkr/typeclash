/**
 * GameRoom — manages the lifecycle of a single multiplayer typing match.
 *
 * States: WAITING → COUNTDOWN → PLAYING → FINISHED
 * Capacity: 2 players (player1, player2)
 */
export class GameRoom {
  constructor(roomCode, options = {}) {
    this.roomCode = roomCode;
    this.state = 'WAITING'; // WAITING | COUNTDOWN | PLAYING | FINISHED
    this.players = new Map(); // socketId → { id, progress, finished, results }
    this.text = null;         // Set when the room starts
    this.duration = options.duration || 30;
    this.category = options.category || 'all';
    this.punctuation = options.punctuation || false;
    this.createdAt = Date.now();
    this.gameStartTime = null;
    this.countdownTimer = null;
    this.gameTimer = null;
  }

  // ── Player management ──────────────────────────────────────────────

  /**
   * Add a player to the room.
   * @param {string} socketId
   * @returns {{ id: string, socketId: string } | null} Player info, or null if room is full.
   */
  addPlayer(socketId) {
    if (this.isFull()) return null;

    const playerId = this.players.size === 0 ? 'player1' : 'player2';
    const playerInfo = {
      id: playerId,
      progress: { position: 0, wpm: 0, accuracy: 100 },
      finished: false,
      results: null
    };

    this.players.set(socketId, playerInfo);
    return { id: playerId, socketId };
  }

  /**
   * Remove a player from the room.
   * @param {string} socketId
   * @returns {number} Remaining player count.
   */
  removePlayer(socketId) {
    this.players.delete(socketId);
    return this.players.size;
  }

  /** @returns {boolean} */
  isFull() {
    return this.players.size >= 2;
  }

  /** @returns {boolean} */
  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * Get the opponent's socket ID.
   * @param {string} socketId
   * @returns {string | null}
   */
  getOpponent(socketId) {
    for (const [id] of this.players) {
      if (id !== socketId) return id;
    }
    return null;
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

    const results = this.getResults();
    // Send personalized results to each player
    for (const [sid, player] of this.players) {
      const oppSid = this.getOpponent(sid);
      const oppPlayer = oppSid ? this.players.get(oppSid) : null;
      io.to(sid).emit('game:over', {
        reason: 'time',
        player: player.results || player.progress,
        opponent: oppPlayer ? (oppPlayer.results || oppPlayer.progress) : null,
        winner: results.winner === player.id ? 'you' : (results.winner ? 'opponent' : 'draw')
      });
    }
  }

  // ── Progress & results ─────────────────────────────────────────────

  /**
   * Update a player's live progress.
   * @param {string} socketId
   * @param {{ position: number, wpm: number, accuracy: number }} data
   */
  updateProgress(socketId, data) {
    const player = this.players.get(socketId);
    if (!player) return;

    player.progress = {
      position: data.position ?? player.progress.position,
      wpm: data.wpm ?? player.progress.wpm,
      accuracy: data.accuracy ?? player.progress.accuracy
    };
  }

  /**
   * Mark a player as finished and record their results.
   * @param {string} socketId
   * @param {{ wpm: number, rawWpm: number, accuracy: number, consistency: number, charStats: object }} results
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
   * Check if the game is over (both finished or state already FINISHED).
   * @returns {boolean}
   */
  isGameOver() {
    if (this.state === 'FINISHED') return true;

    let allFinished = true;
    for (const [, player] of this.players) {
      if (!player.finished) {
        allFinished = false;
        break;
      }
    }
    return allFinished;
  }

  /**
   * Compile final results for both players plus a winner determination.
   * @returns {{ player1: object | null, player2: object | null, winner: string | null }}
   */
  getResults() {
    let player1 = null;
    let player2 = null;

    for (const [socketId, player] of this.players) {
      const entry = {
        socketId,
        playerId: player.id,
        finished: player.finished,
        ...(player.results || player.progress)
      };

      if (player.id === 'player1') {
        player1 = entry;
      } else {
        player2 = entry;
      }
    }

    // Determine winner by WPM (higher wins); ties go to better accuracy
    let winner = null;
    if (player1 && player2) {
      const wpm1 = player1.wpm ?? 0;
      const wpm2 = player2.wpm ?? 0;

      if (wpm1 > wpm2) {
        winner = 'player1';
      } else if (wpm2 > wpm1) {
        winner = 'player2';
      } else {
        // Tie-break on accuracy
        const acc1 = player1.accuracy ?? 0;
        const acc2 = player2.accuracy ?? 0;
        if (acc1 > acc2) {
          winner = 'player1';
        } else if (acc2 > acc1) {
          winner = 'player2';
        } else {
          winner = null; // Perfect tie — same WPM and same accuracy
        }
      }
    }

    return { player1, player2, winner };
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
