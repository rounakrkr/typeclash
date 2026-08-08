import { GameRoom } from './game-room.js';
import { getTextForRoom } from '../services/text-provider.js';

/** Active rooms keyed by room code. */
const rooms = new Map();

/** Map each socket ID to the room code it belongs to for fast lookup. */
const socketToRoom = new Map();

/** Active usernames → socketId (for uniqueness enforcement). */
const activeUsernames = new Map(); // username → socketId

/** Rematch pending: oldRoomCode → { requesterId, newRoomCode, duration } */
const rematchPending = new Map();

/**
 * Generate a unique 4-character uppercase alphanumeric room code.
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
 */
export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // ── username:check ──────────────────────────────────────────────
    // New visitor picking a username for the first time
    socket.on('username:check', ({ username } = {}) => {
      if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
        return socket.emit('username:taken');
      }
      const existing = activeUsernames.get(username.toLowerCase());
      if (existing && existing !== socket.id) {
        return socket.emit('username:taken');
      }
      // Reserve username
      activeUsernames.set(username.toLowerCase(), socket.id);
      socket.data.username = username;
      socket.emit('username:ok', { username });
      console.log(`Username claimed: "${username}" by ${socket.id}`);
    });

    // ── username:register ───────────────────────────────────────────
    // Returning visitor re-registering their saved username on reconnect
    socket.on('username:register', ({ username } = {}) => {
      if (!username) return;
      const existing = activeUsernames.get(username.toLowerCase());
      // Allow re-registration for same socket or if not taken
      if (!existing || existing === socket.id) {
        activeUsernames.set(username.toLowerCase(), socket.id);
        socket.data.username = username;
      }
    });

    // ── room:create ─────────────────────────────────────────────────
    socket.on('room:create', (data = {}) => {
      const roomCode = generateRoomCode();
      const room = new GameRoom(roomCode, {
        duration: data.duration,
        category: data.category,
        punctuation: data.punctuation
      });

      const username = socket.data.username || 'Player1';
      const player = room.addPlayer(socket.id, username);
      rooms.set(roomCode, room);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`Room ${roomCode} created by ${username} (${socket.id})`);

      socket.emit('room:created', {
        roomCode,
        playerId: player.id,
        players: room.getPlayersInfo()
      });
    });

    // ── room:join ───────────────────────────────────────────────────
    socket.on('room:join', (data = {}) => {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        return socket.emit('room:error', { message: 'Room not found' });
      }
      if (room.isFull()) {
        return socket.emit('room:error', { message: 'Room is full (max 4 players)' });
      }
      if (room.state !== 'WAITING') {
        return socket.emit('room:error', { message: 'Game already in progress' });
      }

      const username = socket.data.username || `Player${room.players.size + 1}`;
      const player = room.addPlayer(socket.id, username);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`${username} (${socket.id}) joined room ${roomCode} as ${player.id}`);

      const playersInfo = room.getPlayersInfo();

      // Tell the joining player their info + full player list
      socket.emit('room:you_joined', {
        roomCode,
        playerId: player.id,
        isHost: player.isHost,
        players: playersInfo,
        duration: room.duration
      });

      // Tell everyone else a new player joined
      socket.to(roomCode).emit('room:player_joined', {
        players: playersInfo
      });
    });

    // ── room:start ──────────────────────────────────────────────────
    // Only host can trigger this — picks text and starts countdown
    socket.on('room:start', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room) return;
      if (!room.isHost(socket.id)) {
        return socket.emit('room:error', { message: 'Only the host can start the game' });
      }
      if (room.players.size < 2) {
        return socket.emit('room:error', { message: 'Need at least 2 players to start' });
      }
      if (room.state !== 'WAITING') return;

      // Pick text
      room.text = getTextForRoom(room.duration);

      // Notify all players — game is starting
      io.to(roomCode).emit('room:starting', {
        text: room.text.text,
        duration: room.duration,
        players: room.getPlayersInfo()
      });

      room.startCountdown(io);
      console.log(`Room ${roomCode} started by host ${socket.id}`);
    });

    // ── player:keystroke ────────────────────────────────────────────
    socket.on('player:keystroke', (data = {}) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room || room.state !== 'PLAYING') return;

      room.updateProgress(socket.id, data);

      const player = room.players.get(socket.id);
      // Broadcast progress to all OTHER players in the room
      socket.to(roomCode).emit('opponent:progress', {
        socketId: socket.id,
        playerId: player.id,
        username: player.username,
        position: player.progress.position,
        wpm: player.progress.wpm,
        accuracy: player.progress.accuracy,
        progress: player.progress.progressPct
      });
    });

    // ── player:finish ───────────────────────────────────────────────
    socket.on('player:finish', (data = {}) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room || room.state !== 'PLAYING') return;

      room.playerFinished(socket.id, data);

      const player = room.players.get(socket.id);
      // Notify everyone else this player finished
      socket.to(roomCode).emit('opponent:finished', {
        socketId: socket.id,
        playerId: player.id,
        username: player.username,
        wpm: data.wpm,
        accuracy: data.accuracy
      });

      // Check if ALL players are done
      if (room.isGameOver()) {
        room.state = 'FINISHED';
        room.cleanup();
        const allResults = room.getAllResults();
        for (const [sid, p] of room.players) {
          io.to(sid).emit('game:over', {
            reason: 'complete',
            myPlayerId: p.id,
            allResults
          });
        }
      }
    });

    // ── room:leave ──────────────────────────────────────────────────
    socket.on('room:leave', () => {
      handleLeave(socket, io);
    });

    // ── rematch:request ─────────────────────────────────────────────
    socket.on('rematch:request', ({ oldRoomCode, duration }) => {
      const existing = rematchPending.get(oldRoomCode);

      if (existing) {
        const newRoom = rooms.get(existing.newRoomCode);
        if (!newRoom || newRoom.isFull()) {
          return socket.emit('room:error', { message: 'Rematch room not available' });
        }

        const username = socket.data.username || 'Player';
        newRoom.addPlayer(socket.id, username);
        socketToRoom.set(socket.id, existing.newRoomCode);
        socket.join(existing.newRoomCode);

        newRoom.text = getTextForRoom(newRoom.duration);
        io.to(existing.newRoomCode).emit('room:starting', {
          text: newRoom.text.text,
          duration: newRoom.duration,
          players: newRoom.getPlayersInfo()
        });

        rematchPending.delete(oldRoomCode);
        newRoom.startCountdown(io);
        console.log(`Rematch started: ${oldRoomCode} → ${existing.newRoomCode}`);
      } else {
        const newRoomCode = generateRoomCode();
        const username = socket.data.username || 'Player';
        const newRoom = new GameRoom(newRoomCode, { duration });
        newRoom.addPlayer(socket.id, username);
        rooms.set(newRoomCode, newRoom);
        socketToRoom.set(socket.id, newRoomCode);
        socket.join(newRoomCode);

        rematchPending.set(oldRoomCode, { requesterId: socket.id, newRoomCode, duration });
        socket.emit('rematch:waiting', { newRoomCode });

        const oldRoom = rooms.get(oldRoomCode);
        if (oldRoom) {
          socket.to(oldRoomCode).emit('rematch:invited', { oldRoomCode, duration });
        }
        console.log(`Rematch requested: ${oldRoomCode} → ${newRoomCode}`);
      }
    });

    // ── disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      // Free username
      if (socket.data.username) {
        const key = socket.data.username.toLowerCase();
        if (activeUsernames.get(key) === socket.id) {
          activeUsernames.delete(key);
        }
      }

      handleLeave(socket, io);
    });
  });
}

/** Shared leave/disconnect logic. */
function handleLeave(socket, io) {
  const roomCode = socketToRoom.get(socket.id);
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  if (!room) {
    socketToRoom.delete(socket.id);
    return;
  }

  const wasPlaying = room.state === 'PLAYING' || room.state === 'COUNTDOWN';
  room.removePlayer(socket.id);
  socketToRoom.delete(socket.id);
  socket.leave(roomCode);

  if (room.isEmpty()) {
    room.cleanup();
    rooms.delete(roomCode);
    console.log(`Room ${roomCode} destroyed (empty)`);
    return;
  }

  // Notify remaining players
  const playersInfo = room.getPlayersInfo();
  io.to(roomCode).emit('room:player_left', {
    socketId: socket.id,
    players: playersInfo,
    newHostSocketId: room.hostSocketId
  });

  // If game was in progress with only 1 left, end it
  if (wasPlaying && room.players.size < 2) {
    room.state = 'FINISHED';
    room.cleanup();
    const allResults = room.getAllResults();
    for (const [sid, p] of room.players) {
      io.to(sid).emit('game:over', {
        reason: 'opponent_disconnected',
        myPlayerId: p.id,
        allResults
      });
    }
  }

  // Cancel any rematch this socket initiated
  for (const [oldCode, data] of rematchPending) {
    if (data.requesterId === socket.id) {
      rematchPending.delete(oldCode);
    }
  }
}
