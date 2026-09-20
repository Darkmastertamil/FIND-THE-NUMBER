import {
  ClientRoomState,
  GameStatus,
  GuessEvaluation,
  GuessRecord,
  Player,
  RoundWinner,
  WheelData,
  FinalResults,
} from '../src/types';

export interface InternalPlayer extends Player {
  socketId: string;
}

export interface InternalRoom {
  code: string;
  hostId: string;
  players: InternalPlayer[];
  status: GameStatus;
  round: number;
  maxRounds: number;
  setterOrder: string[];
  setterIndex: number;
  setterId: string | null;
  secretNumber: number | null;
  possibleMin: number;
  possibleMax: number;
  guesses: GuessRecord[];
  currentGuesserId: string | null;
  guesserCycle: string[]; // shuffle bag of player IDs
  turnExpiresAt: number | null;
  turnDuration: number;
  turnTimer: NodeJS.Timeout | null;
  wheelTimer: NodeJS.Timeout | null;
  wheelData: WheelData | null;
  lastGuessResult: {
    guess: number;
    result: GuessEvaluation;
    playerName: string;
    playerId: string;
  } | null;
  roundWinner: RoundWinner | null;
  finalResults: FinalResults | null;
  isPaused: boolean;
  pauseMessage: string | null;
  isProcessingAction: boolean;
}

const AVATAR_COLORS = [
  '#38bdf8', // Pastel Sky Blue
  '#a78bfa', // Pastel Lavender
  '#f472b6', // Pastel Blossom Pink
  '#34d399', // Pastel Mint Green
  '#fbbf24', // Pastel Buttercup Yellow
  '#fb923c', // Pastel Peach Orange
];

export class GameEngine {
  private rooms: Map<string, InternalRoom> = new Map();

  // Generate 6-digit numeric room code (numbers only, exactly 6 digits)
  public generateRoomCode(): string {
    let code = '';
    let attempts = 0;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while (this.rooms.has(code) && attempts < 10000);
    return code;
  }

  public getRoom(code: string): InternalRoom | undefined {
    return this.rooms.get(code);
  }

  public getRoomBySocketId(socketId: string): InternalRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public createRoom(hostName: string, socketId: string, hostPlayerId?: string): { room: InternalRoom; player: InternalPlayer } {
    const code = this.generateRoomCode();
    const playerId = hostPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const hostPlayer: InternalPlayer = {
      id: playerId,
      socketId,
      name: hostName.trim(),
      connected: true,
      score: 0,
      roundWins: 0,
      isHost: true,
      avatarColor: AVATAR_COLORS[0],
    };

    const room: InternalRoom = {
      code,
      hostId: playerId,
      players: [hostPlayer],
      status: 'lobby',
      round: 1,
      maxRounds: 5,
      setterOrder: [playerId],
      setterIndex: 0,
      setterId: null,
      secretNumber: null,
      possibleMin: 1,
      possibleMax: 1000,
      guesses: [],
      currentGuesserId: null,
      guesserCycle: [],
      turnExpiresAt: null,
      turnDuration: 15000,
      turnTimer: null,
      wheelTimer: null,
      wheelData: null,
      lastGuessResult: null,
      roundWinner: null,
      finalResults: null,
      isPaused: false,
      pauseMessage: null,
      isProcessingAction: false,
    };

    this.rooms.set(code, room);
    return { room, player: hostPlayer };
  }

  public joinRoom(
    code: string,
    playerName: string,
    socketId: string,
    existingPlayerId?: string
  ): { success: boolean; error?: string; room?: InternalRoom; player?: InternalPlayer } {
    const trimmedCode = code.trim();
    const trimmedName = playerName.trim();

    if (!/^\d{6}$/.test(trimmedCode)) {
      return { success: false, error: 'Room code must be exactly 6 digits.' };
    }

    if (trimmedName.length < 2 || trimmedName.length > 16) {
      return { success: false, error: 'Player name must be between 2 and 16 characters.' };
    }

    const room = this.rooms.get(trimmedCode);
    if (!room) {
      return { success: false, error: 'Room not found. Please verify the 6-digit code.' };
    }

    // Check if player is reconnecting with an existing playerId
    if (existingPlayerId) {
      const existing = room.players.find((p) => p.id === existingPlayerId);
      if (existing) {
        existing.socketId = socketId;
        existing.connected = true;
        if (existing.name !== trimmedName && trimmedName) {
          existing.name = trimmedName;
        }

        // If game was paused waiting for players, check if we can resume
        const connectedCount = room.players.filter((p) => p.connected).length;
        if (room.isPaused && connectedCount >= 2) {
          room.isPaused = false;
          room.pauseMessage = null;
        }

        return { success: true, room, player: existing };
      }
    }

    // Check for duplicate name in room (case-insensitive)
    const nameExists = room.players.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.connected
    );
    if (nameExists) {
      return { success: false, error: `A player named "${trimmedName}" is already in this room.` };
    }

    // Maximum 4 players
    if (room.players.length >= 4) {
      return { success: false, error: 'Room is full (Maximum 4 players).' };
    }

    // Do not allow joining if game has progressed past lobby unless reconnecting
    if (room.status !== 'lobby') {
      return { success: false, error: 'Game is already in progress in this room.' };
    }

    const playerId = existingPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const colorIndex = room.players.length % AVATAR_COLORS.length;

    const newPlayer: InternalPlayer = {
      id: playerId,
      socketId,
      name: trimmedName,
      connected: true,
      score: 0,
      roundWins: 0,
      isHost: room.players.length === 0,
      avatarColor: AVATAR_COLORS[colorIndex],
    };

    room.players.push(newPlayer);
    if (!room.setterOrder.includes(playerId)) {
      room.setterOrder.push(playerId);
    }

    return { success: true, room, player: newPlayer };
  }

  public startGame(room: InternalRoom, playerId: string): { success: boolean; error?: string } {
    if (room.hostId !== playerId) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      return { success: false, error: 'At least 2 players are required to start.' };
    }
    if (connectedPlayers.length > 4) {
      return { success: false, error: 'Maximum 4 players allowed.' };
    }

    room.round = 1;
    room.setterOrder = connectedPlayers.map((p) => p.id);
    room.setterIndex = 0;
    room.finalResults = null;

    // Reset scores & wins
    for (const p of room.players) {
      p.score = 0;
      p.roundWins = 0;
    }

    this.startRound(room);
    return { success: true };
  }

  public startRound(room: InternalRoom) {
    this.clearTimers(room);

    room.status = 'setter_selection';
    room.secretNumber = null;
    room.possibleMin = 1;
    room.possibleMax = 1000;
    room.guesses = [];
    room.currentGuesserId = null;
    room.guesserCycle = [];
    room.wheelData = null;
    room.lastGuessResult = null;
    room.roundWinner = null;
    room.isProcessingAction = false;

    // Determine setter fairly based on setterIndex
    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for another player to continue...';
      return;
    }

    const setterId = room.setterOrder[room.setterIndex % room.setterOrder.length];
    const setterPlayer = connectedPlayers.find((p) => p.id === setterId) || connectedPlayers[0];
    room.setterId = setterPlayer.id;
  }

  public setSecretNumber(
    room: InternalRoom,
    playerId: string,
    secret: number
  ): { success: boolean; error?: string } {
    if (room.status !== 'setter_selection') {
      return { success: false, error: 'Secret number can only be set during setter phase.' };
    }

    if (room.setterId !== playerId) {
      return { success: false, error: 'Only the designated Number Setter can choose the secret number.' };
    }

    if (!Number.isInteger(secret) || secret < 1 || secret > 1000) {
      return { success: false, error: 'Secret number must be an integer between 1 and 1000.' };
    }

    room.secretNumber = secret;
    return { success: true };
  }

  // Prepares and initiates the next spin wheel selection
  public prepareNextWheelSelection(room: InternalRoom): WheelData | null {
    this.clearTimers(room);

    const eligiblePlayers = room.players.filter(
      (p) => p.connected && p.id !== room.setterId
    );

    if (eligiblePlayers.length === 0) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for eligible guessing players...';
      return null;
    }

    // Refill and shuffle cycle if empty or out of bounds
    if (room.guesserCycle.length === 0) {
      // Shuffle eligible player IDs (Fisher-Yates)
      const shuffled = eligiblePlayers.map((p) => p.id);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      room.guesserCycle = shuffled;
    }

    // Pick next player from cycle who is still connected
    let nextPlayerId = room.guesserCycle.shift();
    while (nextPlayerId && !eligiblePlayers.some((p) => p.id === nextPlayerId)) {
      nextPlayerId = room.guesserCycle.shift();
    }

    // Fallback if needed
    if (!nextPlayerId || !eligiblePlayers.some((p) => p.id === nextPlayerId)) {
      nextPlayerId = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)].id;
    }

    const selectedPlayer = eligiblePlayers.find((p) => p.id === nextPlayerId)!;
    const selectedIndex = eligiblePlayers.findIndex((p) => p.id === nextPlayerId);

    // Calculate exact target rotation so top pointer lands on selected player's segment
    // Circle: 360 deg. N segments.
    // Each segment is (360 / N) deg.
    // Segment i center angle = i * segAngle + segAngle / 2
    // To rotate segment i to top (0 deg):
    // targetAngle = 360 * 5 + (360 - centerAngle)
    const N = eligiblePlayers.length;
    const segAngle = 360 / N;
    const centerAngle = selectedIndex * segAngle + segAngle / 2;
    // Add small random jitter inside segment (+-25% of segAngle) for realism
    const jitter = (Math.random() - 0.5) * (segAngle * 0.4);
    const fullSpins = 4; // 4 full rotations
    const spinTargetDegrees = fullSpins * 360 + (360 - centerAngle) + jitter;

    const spinDurationMs = N === 1 ? 1500 : 3500;

    const wheelData: WheelData = {
      selectedPlayerId: selectedPlayer.id,
      selectedPlayerName: selectedPlayer.name,
      eligiblePlayers: eligiblePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
      })),
      spinDurationMs,
      spinTargetDegrees,
    };

    room.status = 'wheel_spinning';
    room.wheelData = wheelData;
    room.currentGuesserId = selectedPlayer.id;

    return wheelData;
  }

  // Starts the guessing turn for currentGuesserId after wheel completes
  public startGuesserTurn(room: InternalRoom): void {
    this.clearTimers(room);
    room.status = 'guessing';
    room.turnExpiresAt = Date.now() + room.turnDuration;
    room.isProcessingAction = false;
  }

  public submitGuess(
    room: InternalRoom,
    playerId: string,
    guessNumber: number
  ): {
    success: boolean;
    error?: string;
    result?: GuessEvaluation;
    isCorrect?: boolean;
    record?: GuessRecord;
    roundWinner?: RoundWinner;
  } {
    if (room.status !== 'guessing') {
      return { success: false, error: 'Not currently accepting guesses.' };
    }

    if (room.currentGuesserId !== playerId) {
      return { success: false, error: 'It is not your turn to guess.' };
    }

    if (room.setterId === playerId) {
      return { success: false, error: 'The Number Setter cannot guess in their own round.' };
    }

    if (!Number.isInteger(guessNumber) || guessNumber < 1 || guessNumber > 1000) {
      return { success: false, error: 'Guess must be an integer between 1 and 1000.' };
    }

    // Reject duplicate guess by the SAME player in this round
    const duplicate = room.guesses.some(
      (g) => g.playerId === playerId && g.guess === guessNumber
    );
    if (duplicate) {
      // Do not consume turn
      return { success: false, error: '⚠️ You already guessed that number.' };
    }

    if (room.secretNumber === null) {
      return { success: false, error: 'Secret number has not been set.' };
    }

    const player = room.players.find((p) => p.id === playerId);
    const playerName = player ? player.name : 'Unknown';

    let result: GuessEvaluation;
    if (guessNumber < room.secretNumber) {
      result = 'HIGHER';
      room.possibleMin = Math.max(room.possibleMin, guessNumber + 1);
    } else if (guessNumber > room.secretNumber) {
      result = 'LOWER';
      room.possibleMax = Math.min(room.possibleMax, guessNumber - 1);
    } else {
      result = 'CORRECT';
    }

    const record: GuessRecord = {
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId,
      playerName,
      guess: guessNumber,
      result,
      round: room.round,
      timestamp: Date.now(),
    };

    room.guesses.push(record);
    room.lastGuessResult = {
      guess: guessNumber,
      result,
      playerName,
      playerId,
    };

    if (result === 'CORRECT') {
      this.clearTimers(room);
      // Calculate score: Base 100 - (5 * incorrect guesses), min 10 points
      const incorrectGuessesInRound = room.guesses.filter((g) => g.result !== 'CORRECT').length;
      const scoreAwarded = Math.max(10, 100 - incorrectGuessesInRound * 5);

      if (player) {
        player.score += scoreAwarded;
        player.roundWins += 1;
      }

      const roundWinner: RoundWinner = {
        playerId,
        playerName,
        secretNumber: room.secretNumber,
        scoreAwarded,
        incorrectGuessesInRound,
      };

      room.roundWinner = roundWinner;
      room.status = 'round_result';
      room.currentGuesserId = null;

      // Check if match completed (after 5 rounds)
      if (room.round >= room.maxRounds) {
        this.finishMatch(room);
      }

      return { success: true, result, isCorrect: true, record, roundWinner };
    }

    return { success: true, result, isCorrect: false, record };
  }

  public nextRound(room: InternalRoom, requestingPlayerId: string): { success: boolean; error?: string } {
    if (room.status !== 'round_result') {
      return { success: false, error: 'Current round is not complete.' };
    }

    if (room.round >= room.maxRounds) {
      this.finishMatch(room);
      return { success: true };
    }

    // Advance round and rotate setter
    room.round += 1;
    room.setterIndex += 1;
    this.startRound(room);
    return { success: true };
  }

  public finishMatch(room: InternalRoom): FinalResults {
    this.clearTimers(room);
    room.status = 'final_result';

    // Calculate rankings
    const sorted = [...room.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.roundWins - a.roundWins;
    });

    const highestScore = sorted.length > 0 ? sorted[0].score : 0;
    const topPlayers = sorted.filter((p) => p.score === highestScore);
    const isDraw = topPlayers.length > 1;

    let currentRank = 1;
    const rankings = sorted.map((p, idx) => {
      if (idx > 0 && p.score < sorted[idx - 1].score) {
        currentRank = idx + 1;
      }
      return {
        playerId: p.id,
        name: p.name,
        score: p.score,
        roundWins: p.roundWins,
        avatarColor: p.avatarColor,
        rank: currentRank,
      };
    });

    const finalResults: FinalResults = {
      rankings,
      isDraw,
      winnerNames: topPlayers.map((p) => p.name),
    };

    room.finalResults = finalResults;
    return finalResults;
  }

  public rematch(room: InternalRoom, requestingPlayerId: string): { success: boolean; error?: string } {
    if (room.status !== 'final_result') {
      return { success: false, error: 'Rematch is only available after final results.' };
    }

    this.clearTimers(room);

    // Reset scores, rounds, guesses, setter
    room.round = 1;
    room.setterIndex = 0;
    room.finalResults = null;
    room.roundWinner = null;
    room.guesses = [];
    room.lastGuessResult = null;
    room.secretNumber = null;
    room.possibleMin = 1;
    room.possibleMax = 1000;
    room.currentGuesserId = null;
    room.guesserCycle = [];
    room.wheelData = null;

    for (const p of room.players) {
      p.score = 0;
      p.roundWins = 0;
    }

    this.startRound(room);
    return { success: true };
  }

  public handleDisconnect(socketId: string): {
    room?: InternalRoom;
    disconnectedPlayer?: InternalPlayer;
    shouldAdvanceTurn?: boolean;
    newHost?: InternalPlayer;
  } {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return {};

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return { room };

    player.connected = false;

    // Check host transfer
    let newHost: InternalPlayer | undefined;
    if (player.isHost) {
      player.isHost = false;
      const nextHost = room.players.find((p) => p.connected);
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
        newHost = nextHost;
      }
    }

    const connectedPlayers = room.players.filter((p) => p.connected);

    // Check if total players < 2 during active game
    if (connectedPlayers.length < 2 && room.status !== 'lobby') {
      room.isPaused = true;
      room.pauseMessage = '⚠️ Waiting for another player to reconnect...';
      this.clearTimers(room);
      return { room, disconnectedPlayer: player, newHost };
    }

    // Check if disconnected player was the active guesser
    let shouldAdvanceTurn = false;
    if (room.currentGuesserId === player.id && (room.status === 'guessing' || room.status === 'wheel_spinning')) {
      shouldAdvanceTurn = true;
      this.clearTimers(room);
    }

    // Check if disconnected player was setter during secret selection
    if (room.setterId === player.id && room.status === 'setter_selection') {
      room.setterIndex += 1;
      this.startRound(room);
    }

    return { room, disconnectedPlayer: player, shouldAdvanceTurn, newHost };
  }

  public clearTimers(room: InternalRoom) {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }
    if (room.wheelTimer) {
      clearTimeout(room.wheelTimer);
      room.wheelTimer = null;
    }
  }

  // Produces a client-safe snapshot of the room state.
  // CRITICAL: Never leaks the secret number to guessers!
  public getClientRoomState(room: InternalRoom, requestingPlayerId?: string): ClientRoomState {
    const isRoundEnded = room.status === 'round_result' || room.status === 'final_result';
    const isSetter = room.setterId === requestingPlayerId;

    const setterPlayer = room.players.find((p) => p.id === room.setterId);
    const guesserPlayer = room.players.find((p) => p.id === room.currentGuesserId);

    return {
      code: room.code,
      hostId: room.hostId,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
        score: p.score,
        avatarColor: p.avatarColor,
        isHost: p.isHost,
        roundWins: p.roundWins,
      })),
      status: room.status,
      round: room.round,
      maxRounds: room.maxRounds,
      setterId: room.setterId,
      setterName: setterPlayer ? setterPlayer.name : null,
      currentGuesserId: room.currentGuesserId,
      currentGuesserName: guesserPlayer ? guesserPlayer.name : null,
      possibleMin: room.possibleMin,
      possibleMax: room.possibleMax,
      guesses: room.guesses,
      turnExpiresAt: room.turnExpiresAt,
      turnDuration: room.turnDuration,
      wheelData: room.wheelData,
      lastGuessResult: room.lastGuessResult,
      roundWinner: isRoundEnded ? room.roundWinner : null,
      finalResults: room.finalResults,
      myLockedSecret: isSetter ? room.secretNumber : null,
      isPaused: room.isPaused,
      pauseMessage: room.pauseMessage,
    };
  }
}
