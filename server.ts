import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GameEngine, InternalRoom } from './server/gameEngine';

const PORT = Number(process.env.PORT) || 3000;
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

// Helper: Trigger 5-second wheel spin to choose who starts guessing first
function triggerFirstGuesserWheelSpin(room: InternalRoom) {
  engine.clearTimers(room);

  const wheelData = engine.prepareFirstGuesserWheelSelection(room);
  if (!wheelData) {
    broadcastRoomState(room);
    return;
  }

  broadcastRoomState(room);
  io.to(room.code).emit('wheelStarted', wheelData);

  // Wheel animation runs on clients for exactly wheelData.spinDurationMs (5000ms)
  // Allow an extra 1500ms celebration cushion so all players see who was chosen
  room.wheelTimer = setTimeout(() => {
    if (room.status !== 'wheel_spinning') return;

    engine.transitionToNumberSelection(room);
    broadcastRoomState(room);
    const firstGuesser = room.players.find((p) => p.id === room.firstGuesserId);
    io.to(room.code).emit('firstGuesserChosen', {
      firstGuesserId: room.firstGuesserId,
      firstGuesserName: firstGuesser ? firstGuesser.name : 'Player',
    });
  }, wheelData.spinDurationMs + 1500);
}

// Helper: Handle when a guesser runs out of 30 seconds
function handleTurnTimeout(room: InternalRoom) {
  if (room.status !== 'guessing') return;

  const guesser = room.players.find((p) => p.id === room.currentGuesserId);
  const guesserName = guesser ? guesser.name : 'Player';

  io.to(room.code).emit('turnTimedOut', {
    playerName: guesserName,
    message: `⏰ Time's up for ${guesserName}! Turn rotates.`,
  });

  // Brief pause before advancing turn to the next guesser
  setTimeout(() => {
    if (room.status !== 'guessing' || room.isPaused) return;

    const nextGuesser = engine.advanceGuesserTurn(room);
    if (!nextGuesser) {
      broadcastRoomState(room);
      return;
    }

    broadcastRoomState(room);
    io.to(room.code).emit('turnStarted', {
      guesserId: room.currentGuesserId,
      expiresAt: room.turnExpiresAt,
      duration: room.turnDuration,
    });

    room.turnTimer = setTimeout(() => {
      handleTurnTimeout(room);
    }, room.turnDuration);
  }, 1200);
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
    io.to(room.code).emit('roundStarted', { round: room.round });
    triggerFirstGuesserWheelSpin(room);
  });

  // SUBMIT SECRET NUMBER (BOTH / ALL PLAYERS SIMULTANEOUSLY)
  socket.on(
    'submitSecret',
    ({ code, playerId, secret }: { code: string; playerId: string; secret: number }, callback) => {
      const room = engine.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found.' });
        return;
      }

      const result = engine.setPlayerSecretNumber(room, playerId, secret);
      if (!result.success) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      if (typeof callback === 'function') callback({ success: true, allLocked: result.allLocked });

      const player = room.players.find((p) => p.id === playerId);
      io.to(room.code).emit('playerSecretLocked', {
        playerId,
        playerName: player ? player.name : 'Player',
      });

      broadcastRoomState(room);

      // If all connected players have locked their secret numbers, launch the guessing phase!
      if (result.allLocked) {
        io.to(room.code).emit('allSecretsLocked', {
          message: 'Both players have locked their secrets! The duel begins now!',
        });

        const firstGuesser = engine.startGuessingPhase(room);
        broadcastRoomState(room);

        if (firstGuesser) {
          io.to(room.code).emit('turnStarted', {
            guesserId: room.currentGuesserId,
            expiresAt: room.turnExpiresAt,
            duration: room.turnDuration,
          });

          room.turnTimer = setTimeout(() => {
            handleTurnTimeout(room);
          }, room.turnDuration);
        }
      }
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
        });
        broadcastRoomState(room);

        // Clear active turn timer
        if (room.turnTimer) {
          clearTimeout(room.turnTimer);
          room.turnTimer = null;
        }

        // Pause 1.8s so all players see HIGHER / LOWER result, then advance turn to next guesser
        setTimeout(() => {
          if (room.status !== 'guessing' || room.isPaused) return;

          const nextGuesser = engine.advanceGuesserTurn(room);
          if (!nextGuesser) {
            broadcastRoomState(room);
            return;
          }

          broadcastRoomState(room);
          io.to(room.code).emit('turnStarted', {
            guesserId: room.currentGuesserId,
            expiresAt: room.turnExpiresAt,
            duration: room.turnDuration,
          });

          room.turnTimer = setTimeout(() => {
            handleTurnTimeout(room);
          }, room.turnDuration);
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
    if (room.status === 'wheel_spinning') {
      triggerFirstGuesserWheelSpin(room);
    } else {
      broadcastRoomState(room);
    }
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
    if (room.status === 'wheel_spinning') {
      triggerFirstGuesserWheelSpin(room);
    } else {
      broadcastRoomState(room);
    }
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

      if (room.status === 'wheel_spinning' && !room.isPaused) {
        triggerFirstGuesserWheelSpin(room);
      } else if (shouldAdvanceTurn && room.status === 'guessing' && !room.isPaused) {
        setTimeout(() => {
          const nextGuesser = engine.advanceGuesserTurn(room);
          if (nextGuesser) {
            broadcastRoomState(room);
            io.to(room.code).emit('turnStarted', {
              guesserId: room.currentGuesserId,
              expiresAt: room.turnExpiresAt,
              duration: room.turnDuration,
            });

            room.turnTimer = setTimeout(() => {
              handleTurnTimeout(room);
            }, room.turnDuration);
          }
        }, 1000);
      }
    }
  });
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasBuiltFrontend = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasBuiltFrontend) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 FIND THE NUMBER server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
