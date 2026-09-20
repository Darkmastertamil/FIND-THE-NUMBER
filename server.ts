import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GameEngine, InternalRoom } from './server/gameEngine';

const PORT = 3000;
const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

const engine = new GameEngine();

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Helper: Broadcast room state securely to each connected player in room
function broadcastRoomState(room: InternalRoom) {
  for (const player of room.players) {
    if (player.connected && player.socketId) {
      const clientState = engine.getClientRoomState(room, player.id);
      io.to(player.socketId).emit('roomStateUpdate', clientState);
    }
  }
}

// Helper: Trigger wheel spin and subsequent turn sequence
function triggerWheelSpin(room: InternalRoom) {
  engine.clearTimers(room);

  const wheelData = engine.prepareNextWheelSelection(room);
  if (!wheelData) {
    broadcastRoomState(room);
    return;
  }

  broadcastRoomState(room);
  io.to(room.code).emit('wheelStarted', wheelData);

  // Wheel animation runs on clients for wheelData.spinDurationMs
  // Allow an extra 600ms cushion for deceleration settling
  room.wheelTimer = setTimeout(() => {
    if (room.status !== 'wheel_spinning') return;

    engine.startGuesserTurn(room);
    broadcastRoomState(room);
    io.to(room.code).emit('turnStarted', {
      guesserId: room.currentGuesserId,
      expiresAt: room.turnExpiresAt,
      duration: room.turnDuration,
    });

    // Authoritative 15-second server turn timer
    room.turnTimer = setTimeout(() => {
      handleTurnTimeout(room);
    }, room.turnDuration);
  }, wheelData.spinDurationMs + 600);
}

// Helper: Handle when a player runs out of 15 seconds
function handleTurnTimeout(room: InternalRoom) {
  if (room.status !== 'guessing') return;

  const guesser = room.players.find((p) => p.id === room.currentGuesserId);
  const guesserName = guesser ? guesser.name : 'Player';

  io.to(room.code).emit('turnTimedOut', {
    playerName: guesserName,
    message: `⏰ Time's up for ${guesserName}!`,
  });

  // Brief pause before spinning wheel for the next player
  setTimeout(() => {
    const connectedGuessers = room.players.filter(
      (p) => p.connected && p.id !== room.setterId
    );
    if (connectedGuessers.length > 0 && !room.isPaused) {
      triggerWheelSpin(room);
    }
  }, 1500);
}

io.on('connection', (socket: Socket) => {
  // CREATE ROOM
  socket.on('createRoom', ({ playerName, playerId }: { playerName: string; playerId?: string }, callback) => {
    try {
      const trimmedName = (playerName || '').trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 16) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Name must be between 2 and 16 characters.' });
        }
        return;
      }

      const { room, player } = engine.createRoom(trimmedName, socket.id, playerId);
      socket.join(room.code);

      const clientState = engine.getClientRoomState(room, player.id);
      if (typeof callback === 'function') {
        callback({ success: true, room: clientState, player });
      }
      broadcastRoomState(room);
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message || 'Failed to create room.' });
      }
    }
  });

  // JOIN ROOM
  socket.on(
    'joinRoom',
    ({ code, playerName, playerId }: { code: string; playerName: string; playerId?: string }, callback) => {
      try {
        const result = engine.joinRoom(code, playerName, socket.id, playerId);
        if (!result.success || !result.room || !result.player) {
          if (typeof callback === 'function') {
            callback({ success: false, error: result.error || 'Failed to join room.' });
          }
          return;
        }

        socket.join(result.room.code);
        const clientState = engine.getClientRoomState(result.room, result.player.id);
        if (typeof callback === 'function') {
          callback({ success: true, room: clientState, player: result.player });
        }
        broadcastRoomState(result.room);
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to join room.' });
        }
      }
    }
  );

  // START GAME
  socket.on('startGame', ({ code, playerId }: { code: string; playerId: string }, callback) => {
    const room = engine.getRoom(code);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
      return;
    }

    const result = engine.startGame(room, playerId);
    if (!result.success) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    if (typeof callback === 'function') callback({ success: true });
    broadcastRoomState(room);
    io.to(room.code).emit('roundStarted', { round: room.round, setterId: room.setterId });
  });

  // SUBMIT SECRET NUMBER (SETTER ONLY)
  socket.on(
    'submitSecret',
    ({ code, playerId, secret }: { code: string; playerId: string; secret: number }, callback) => {
      const room = engine.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
        return;
      }

      const result = engine.setSecretNumber(room, playerId, secret);
      if (!result.success) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      if (typeof callback === 'function') callback({ success: true });

      // Notify clients secret is locked
      io.to(room.code).emit('secretLocked', {
        message: 'Secret number has been locked! Spinning wheel for first guesser...',
      });
      broadcastRoomState(room);

      // Trigger first wheel spin after brief 1.2s delay for visual feedback
      setTimeout(() => {
        if (room.status === 'setter_selection' && room.secretNumber !== null) {
          triggerWheelSpin(room);
        }
      }, 1200);
    }
  );

  // SUBMIT GUESS
  socket.on(
    'submitGuess',
    ({ code, playerId, guess }: { code: string; playerId: string; guess: number }, callback) => {
      const room = engine.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
        return;
      }

      const parsedGuess = parseInt(String(guess), 10);
      const outcome = engine.submitGuess(room, playerId, parsedGuess);

      if (!outcome.success) {
        if (typeof callback === 'function') callback({ success: false, error: outcome.error });
        return;
      }

      if (typeof callback === 'function') {
        callback({ success: true, result: outcome.result, isCorrect: outcome.isCorrect });
      }

      if (outcome.isCorrect) {
        // Broadcast correct guess and round completion
        io.to(room.code).emit('guessResult', {
          guess: parsedGuess,
          result: 'CORRECT',
          record: outcome.record,
          roundWinner: outcome.roundWinner,
          isCorrect: true,
        });
        broadcastRoomState(room);
      } else {
        // Higher or Lower
        io.to(room.code).emit('guessResult', {
          guess: parsedGuess,
          result: outcome.result,
          record: outcome.record,
          isCorrect: false,
          possibleMin: room.possibleMin,
          possibleMax: room.possibleMax,
        });
        broadcastRoomState(room);

        // Pause 1.8s so all players see HIGHER / LOWER result, then spin wheel for next turn
        setTimeout(() => {
          if (room.status === 'guessing' || room.status === 'wheel_spinning') {
            triggerWheelSpin(room);
          }
        }, 1800);
      }
    }
  );

  // NEXT ROUND
  socket.on('nextRound', ({ code, playerId }: { code: string; playerId: string }, callback) => {
    const room = engine.getRoom(code);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
      return;
    }

    const result = engine.nextRound(room, playerId);
    if (!result.success) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    if (typeof callback === 'function') callback({ success: true });
    broadcastRoomState(room);
  });

  // REMATCH / PLAY AGAIN
  socket.on('rematch', ({ code, playerId }: { code: string; playerId: string }, callback) => {
    const room = engine.getRoom(code);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
      return;
    }

    const result = engine.rematch(room, playerId);
    if (!result.success) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    if (typeof callback === 'function') callback({ success: true });
    broadcastRoomState(room);
  });

  // SYNC REQUEST (e.g. on client refresh or mount)
  socket.on('syncRoom', ({ code, playerId }: { code: string; playerId: string }, callback) => {
    const room = engine.getRoom(code);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socket.id;
      player.connected = true;
      socket.join(room.code);
    }

    const clientState = engine.getClientRoomState(room, playerId);
    if (typeof callback === 'function') callback({ success: true, room: clientState });
    broadcastRoomState(room);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const { room, disconnectedPlayer, shouldAdvanceTurn, newHost } = engine.handleDisconnect(socket.id);
    if (room && disconnectedPlayer) {
      if (newHost) {
        io.to(room.code).emit('hostTransferred', { hostId: newHost.id, hostName: newHost.name });
      }

      broadcastRoomState(room);

      if (shouldAdvanceTurn && !room.isPaused) {
        setTimeout(() => {
          const eligible = room.players.filter((p) => p.connected && p.id !== room.setterId);
          if (eligible.length > 0) {
            triggerWheelSpin(room);
          }
        }, 1000);
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 FIND THE NUMBER server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
