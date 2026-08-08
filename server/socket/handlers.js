import { GameRoom } from './game-room.js';
import { getTextForRoom } from '../services/text-provider.js';

/** Active rooms keyed by room code. */
const rooms = new Map();

/** Map each socket ID to the room code it belongs to for fast lookup. */
const socketToRoom = new Map();

/** Rematch pending: oldRoomCode → { requesterId, newRoomCode, duration } */
const rematchPending = new Map();

/**
 * Generate a unique 4-character uppercase alphanumeric room code.
 * @returns {string}
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 to avoid confusion
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

/**
 * Register all Socket.io event handlers on the given server instance.
 * @param {import('socket.io').Server} io
 */
export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // ── room:create ────────────────────────────────────────────────
    socket.on('room:create', (data = {}) => {
      const roomCode = generateRoomCode();
      const room = new GameRoom(roomCode, {
        duration: data.duration,
        category: data.category,
        punctuation: data.punctuation
      });

      const player = room.addPlayer(socket.id);
      rooms.set(roomCode, room);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`Room ${roomCode} created by ${socket.id} (${player.id})`);

      socket.emit('room:created', {
        roomCode,
        playerId: player.id
      });
    });

    // ── room:join ──────────────────────────────────────────────────
    socket.on('room:join', (data = {}) => {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      // Validation
      if (!room) {
        return socket.emit('room:error', { message: 'Room not found' });
      }
      if (room.isFull()) {
        return socket.emit('room:error', { message: 'Room is full' });
      }
      if (room.state !== 'WAITING') {
        return socket.emit('room:error', { message: 'Game already in progress' });
      }

      const player = room.addPlayer(socket.id);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`Player ${socket.id} (${player.id}) joined room ${roomCode}`);

      // Pick the text for this match
      room.text = getTextForRoom(room.duration);

      // Notify both players
      io.to(roomCode).emit('room:joined', {
        roomCode,
        text: room.text.text,
        duration: room.duration,
        players: Array.from(room.players.entries()).map(([sid, p]) => ({
          socketId: sid,
          playerId: p.id
        }))
      });

      // Kick off the countdown
      room.startCountdown(io);
    });

    // ── player:keystroke ───────────────────────────────────────────
    socket.on('player:keystroke', (data = {}) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room || room.state !== 'PLAYING') return;

      room.updateProgress(socket.id, data);

      const opponentId = room.getOpponent(socket.id);
      if (opponentId) {
        const player = room.players.get(socket.id);
        io.to(opponentId).emit('opponent:progress', {
          position: player.progress.position,
          wpm: player.progress.wpm,
          accuracy: player.progress.accuracy
        });
      }
    });

    // ── player:finish ──────────────────────────────────────────────
    socket.on('player:finish', (data = {}) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room || room.state !== 'PLAYING') return;

      room.playerFinished(socket.id, data);

      const opponentId = room.getOpponent(socket.id);
      if (opponentId) {
        io.to(opponentId).emit('opponent:finish', {
          wpm: data.wpm,
          accuracy: data.accuracy
        });
      }

      // Check if both players are done
      if (room.isGameOver()) {
        room.state = 'FINISHED';
        room.cleanup();
        const results = room.getResults();
        // Send personalized results to each player
        for (const [sid, player] of room.players) {
          const oppSid = room.getOpponent(sid);
          const oppPlayer = oppSid ? room.players.get(oppSid) : null;
          io.to(sid).emit('game:over', {
            reason: 'complete',
            player: player.results || player.progress,
            opponent: oppPlayer ? (oppPlayer.results || oppPlayer.progress) : null,
            winner: results.winner === player.id ? 'you' : (results.winner ? 'opponent' : 'draw')
          });
        }
      }
    });

    // ── room:leave ─────────────────────────────────────────────────
    socket.on('room:leave', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          const opponentId = room.getOpponent(socket.id);
          room.removePlayer(socket.id);
          if (room.isEmpty()) {
            room.cleanup();
            rooms.delete(roomCode);
          } else if (opponentId) {
            io.to(opponentId).emit('opponent:disconnected', { message: 'Opponent left the room' });
          }
        }
        socketToRoom.delete(socket.id);
        socket.leave(roomCode);
      }
      // Also cancel any pending rematch
      for (const [oldCode, data] of rematchPending) {
        if (data.requesterId === socket.id) {
          rematchPending.delete(oldCode);
        }
      }
    });

    // ── rematch:request ────────────────────────────────────────────
    socket.on('rematch:request', ({ oldRoomCode, duration }) => {
      const existing = rematchPending.get(oldRoomCode);

      if (existing) {
        // Second player accepted — they become player2 in the pending new room
        const newRoom = rooms.get(existing.newRoomCode);
        if (!newRoom || newRoom.isFull()) {
          return socket.emit('room:error', { message: 'Rematch room not available' });
        }

        newRoom.addPlayer(socket.id);
        socketToRoom.set(socket.id, existing.newRoomCode);
        socket.join(existing.newRoomCode);

        // Pick text and notify both
        newRoom.text = getTextForRoom(newRoom.duration);
        io.to(existing.newRoomCode).emit('room:joined', {
          roomCode: existing.newRoomCode,
          text: newRoom.text.text,
          duration: newRoom.duration
        });

        rematchPending.delete(oldRoomCode);
        newRoom.startCountdown(io);
        console.log(`Rematch started: ${oldRoomCode} → ${existing.newRoomCode}`);

      } else {
        // First player requesting rematch — create new room, wait for opponent
        const newRoomCode = generateRoomCode();
        const newRoom = new GameRoom(newRoomCode, { duration });
        newRoom.addPlayer(socket.id);
        rooms.set(newRoomCode, newRoom);
        socketToRoom.set(socket.id, newRoomCode);
        socket.join(newRoomCode);

        rematchPending.set(oldRoomCode, { requesterId: socket.id, newRoomCode, duration });

        // Tell this player: waiting
        socket.emit('rematch:waiting', { newRoomCode });

        // Tell opponent: rematch invite
        const oldRoom = rooms.get(oldRoomCode);
        if (oldRoom) {
          const opponentId = oldRoom.getOpponent(socket.id);
          if (opponentId) {
            io.to(opponentId).emit('rematch:invited', { oldRoomCode, duration });
          }
        }
        console.log(`Rematch requested: ${oldRoomCode} → ${newRoomCode}`);
      }
    });

    // ── disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room) {
        socketToRoom.delete(socket.id);
        return;
      }

      const opponentId = room.getOpponent(socket.id);
      room.removePlayer(socket.id);
      socketToRoom.delete(socket.id);

      if (room.isEmpty()) {
        // No players left — tear down the room
        room.cleanup();
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} destroyed (empty)`);
      } else if (opponentId) {
        // Notify the remaining player
        io.to(opponentId).emit('opponent:disconnected', {
          message: 'Your opponent has disconnected'
        });

        // If the game was in progress, end it
        if (room.state === 'PLAYING' || room.state === 'COUNTDOWN') {
          room.state = 'FINISHED';
          room.cleanup();
          const oppPlayer = room.players.get(opponentId);
          io.to(opponentId).emit('game:over', {
            reason: 'opponent_disconnected',
            player: oppPlayer ? (oppPlayer.results || oppPlayer.progress) : null,
            opponent: null,
            winner: 'you'
          });
        }
      }

      // Cancel any pending rematch this socket initiated
      for (const [oldCode, data] of rematchPending) {
        if (data.requesterId === socket.id) {
          rematchPending.delete(oldCode);
        }
      }
    });
  });
}
