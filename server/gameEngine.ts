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
  firstGuesserId: string | null;
  currentGuesserId: string | null;
  guesserCycle: string[]; // shuffle bag of player IDs
  playerSecrets: Record<string, number>; // secret number chosen by each player
  playerLockedSecrets: Record<string, boolean>; // whether player has locked their secret
  playerRanges: Record<string, { min: number; max: number }>; // search range for each player
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
    targetPlayerName?: string;
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
      firstGuesserId: null,
      currentGuesserId: null,
      guesserCycle: [],
      playerSecrets: {},
      playerLockedSecrets: {},
      playerRanges: {},
      turnExpiresAt: null,
      turnDuration: 30000,
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

  public getTargetPlayer(room: InternalRoom, playerId: string): InternalPlayer | null {
    const connected = room.players.filter((p) => p.connected);
    if (connected.length < 2) return null;
    if (connected.length === 2) {
      return connected.find((p) => p.id !== playerId) || null;
    }
    const idx = connected.findIndex((p) => p.id === playerId);
    if (idx === -1) return connected[0];
    return connected[(idx + 1) % connected.length];
  }

  public startRound(room: InternalRoom): WheelData | null {
    this.clearTimers(room);

    room.secretNumber = null;
    room.playerSecrets = {};
    room.playerLockedSecrets = {};
    room.playerRanges = {};
    room.possibleMin = 1;
    room.possibleMax = 1000;
    room.guesses = [];
    room.firstGuesserId = null;
    room.currentGuesserId = null;
    room.guesserCycle = [];
    room.wheelData = null;
    room.lastGuessResult = null;
    room.roundWinner = null;
    room.isProcessingAction = false;
    room.turnDuration = 30000;

    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for another player to continue...';
      return null;
    }

    for (const p of connectedPlayers) {
      room.playerRanges[p.id] = { min: 1, max: 1000 };
    }

    return this.prepareFirstGuesserWheelSelection(room);
  }

  public prepareFirstGuesserWheelSelection(room: InternalRoom): WheelData | null {
    this.clearTimers(room);

    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for another player to continue...';
      return null;
    }

    // Determine who starts first fairly across rounds
    const availableOrder = room.setterOrder.filter((id) =>
      connectedPlayers.some((p) => p.id === id)
    );
    const candidateOrder = availableOrder.length > 0 ? availableOrder : connectedPlayers.map((p) => p.id);
    const chosenPlayerId = candidateOrder[room.setterIndex % candidateOrder.length];
    const selectedPlayer = connectedPlayers.find((p) => p.id === chosenPlayerId) || connectedPlayers[0];
    const selectedIndex = connectedPlayers.findIndex((p) => p.id === selectedPlayer.id);

    // Calculate exact target rotation so top pointer lands on selected player's segment
    const N = connectedPlayers.length;
    const segAngle = 360 / N;
    const centerAngle = selectedIndex * segAngle + segAngle / 2;
    // Small random jitter within center of segment for optical variety
    const jitter = (Math.random() - 0.5) * (segAngle * 0.3);
    const fullSpins = 6; // 6 full rotations for a dramatic 5-second spin
    const spinTargetDegrees = fullSpins * 360 + (360 - centerAngle) + jitter;

    // Requested: exact 5 seconds (5000ms)
    const spinDurationMs = 5000;

    const wheelData: WheelData = {
      selectedPlayerId: selectedPlayer.id,
      selectedPlayerName: selectedPlayer.name,
      eligiblePlayers: connectedPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
      })),
      spinDurationMs,
      spinTargetDegrees,
      purpose: 'first_guesser',
    };

    room.status = 'wheel_spinning';
    room.wheelData = wheelData;
    room.firstGuesserId = selectedPlayer.id;

    return wheelData;
  }

  public transitionToNumberSelection(room: InternalRoom): void {
    this.clearTimers(room);
    room.status = 'setter_selection';
    room.isProcessingAction = false;
  }

  public setPlayerSecretNumber(
    room: InternalRoom,
    playerId: string,
    secret: number
  ): { success: boolean; error?: string; allLocked?: boolean } {
    if (room.status !== 'setter_selection') {
      return { success: false, error: 'Secret numbers can only be set during the number selection phase.' };
    }

    if (!Number.isInteger(secret) || secret < 1 || secret > 1000) {
      return { success: false, error: 'Secret number must be an integer between 1 and 1000.' };
    }

    room.playerSecrets[playerId] = secret;
    room.playerLockedSecrets[playerId] = true;

    const connectedPlayers = room.players.filter((p) => p.connected);
    const allLocked =
      connectedPlayers.length >= 2 &&
      connectedPlayers.every((p) => room.playerLockedSecrets[p.id]);

    return { success: true, allLocked };
  }

  // Starts the guessing phase after all players have chosen their secret numbers
  public startGuessingPhase(room: InternalRoom): InternalPlayer | null {
    this.clearTimers(room);
    room.status = 'guessing';
    room.guesses = [];
    room.lastGuessResult = null;
    room.turnDuration = 30000; // 30 seconds for each guess!

    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for players to continue...';
      return null;
    }

    for (const p of connectedPlayers) {
      room.playerRanges[p.id] = { min: 1, max: 1000 };
    }

    // Guesser who starts first was chosen by the wheel
    const firstGuesser =
      connectedPlayers.find((p) => p.id === room.firstGuesserId) || connectedPlayers[0];
    room.currentGuesserId = firstGuesser.id;
    room.turnExpiresAt = Date.now() + room.turnDuration;
    room.isProcessingAction = false;
    return firstGuesser;
  }

  // Advances turn to the next player with 30 seconds
  public advanceGuesserTurn(room: InternalRoom): InternalPlayer | null {
    this.clearTimers(room);
    if (room.status !== 'guessing') return null;

    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.isPaused = true;
      room.pauseMessage = 'Waiting for players to continue...';
      return null;
    }

    let nextIdx = 0;
    if (room.currentGuesserId) {
      const currentIdx = connectedPlayers.findIndex((p) => p.id === room.currentGuesserId);
      if (currentIdx !== -1) {
        nextIdx = (currentIdx + 1) % connectedPlayers.length;
      }
    }

    const nextGuesser = connectedPlayers[nextIdx];
    room.currentGuesserId = nextGuesser.id;
    room.turnExpiresAt = Date.now() + room.turnDuration;
    room.isProcessingAction = false;
    return nextGuesser;
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

    if (!Number.isInteger(guessNumber) || guessNumber < 1 || guessNumber > 1000) {
      return { success: false, error: 'Guess must be an integer between 1 and 1000.' };
    }

    // Reject duplicate guess by the SAME player in this round
    const duplicate = room.guesses.some(
      (g) => g.playerId === playerId && g.guess === guessNumber && g.round === room.round
    );
    if (duplicate) {
      return { success: false, error: '⚠️ You already guessed that number in this round.' };
    }

    const targetPlayer = this.getTargetPlayer(room, playerId);
    if (!targetPlayer) {
      return { success: false, error: 'Target opponent not found.' };
    }

    const targetSecret = room.playerSecrets[targetPlayer.id];
    if (targetSecret === undefined || targetSecret === null) {
      return { success: false, error: 'Opponent has not set their secret number.' };
    }

    if (!room.playerRanges[playerId]) {
      room.playerRanges[playerId] = { min: 1, max: 1000 };
    }

    const player = room.players.find((p) => p.id === playerId);
    const playerName = player ? player.name : 'Unknown';

    let result: GuessEvaluation;
    if (guessNumber < targetSecret) {
      result = 'HIGHER';
      room.playerRanges[playerId].min = Math.max(room.playerRanges[playerId].min, guessNumber + 1);
    } else if (guessNumber > targetSecret) {
      result = 'LOWER';
      room.playerRanges[playerId].max = Math.min(room.playerRanges[playerId].max, guessNumber - 1);
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
      targetPlayerName: targetPlayer.name,
    };

    room.guesses.push(record);
    room.lastGuessResult = {
      guess: guessNumber,
      result,
      playerName,
      playerId,
      targetPlayerName: targetPlayer.name,
    };

    if (result === 'CORRECT') {
      this.clearTimers(room);
      const playerGuesses = room.guesses.filter((g) => g.playerId === playerId && g.round === room.round);
      const incorrectGuessesInRound = playerGuesses.filter((g) => g.result !== 'CORRECT').length;
      const scoreAwarded = Math.max(10, 100 - incorrectGuessesInRound * 5);

      if (player) {
        player.score += scoreAwarded;
        player.roundWins += 1;
      }

      const roundWinner: RoundWinner = {
        playerId,
        playerName,
        secretNumber: targetSecret,
        scoreAwarded,
        incorrectGuessesInRound,
        targetPlayerName: targetPlayer.name,
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
    if (room.currentGuesserId === player.id && room.status === 'guessing') {
      shouldAdvanceTurn = true;
      this.clearTimers(room);
    }

    // Check if disconnected player was setter during secret selection or setter wheel
    if (room.setterId === player.id && (room.status === 'setter_selection' || room.status === 'wheel_spinning')) {
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

    const connectedPlayers = room.players.filter((p) => p.connected);
    const targetPlayer = requestingPlayerId ? this.getTargetPlayer(room, requestingPlayerId) : null;
    const guesserPlayer = room.players.find((p) => p.id === room.currentGuesserId);
    const firstGuesser = room.players.find((p) => p.id === room.firstGuesserId);

    const myRange = requestingPlayerId && room.playerRanges[requestingPlayerId]
      ? room.playerRanges[requestingPlayerId]
      : { min: 1, max: 1000 };

    const myLockedSecret = requestingPlayerId && room.playerSecrets[requestingPlayerId] !== undefined
      ? room.playerSecrets[requestingPlayerId]
      : null;

    const hasLockedSecret = requestingPlayerId ? !!room.playerLockedSecrets[requestingPlayerId] : false;
    const lockedPlayersCount = connectedPlayers.filter((p) => room.playerLockedSecrets[p.id]).length;
    const allSecretsLocked = connectedPlayers.length >= 2 && lockedPlayersCount === connectedPlayers.length;

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
      setterId: null,
      setterName: null,
      currentGuesserId: room.currentGuesserId,
      currentGuesserName: guesserPlayer ? guesserPlayer.name : null,
      possibleMin: myRange.min,
      possibleMax: myRange.max,
      guesses: room.guesses,
      turnExpiresAt: room.turnExpiresAt,
      turnDuration: room.turnDuration,
      wheelData: room.wheelData,
      lastGuessResult: room.lastGuessResult,
      roundWinner: isRoundEnded ? room.roundWinner : null,
      finalResults: room.finalResults,
      myLockedSecret,
      hasLockedSecret,
      allSecretsLocked,
      lockedPlayersCount,
      totalPlayersCount: connectedPlayers.length,
      targetOpponentName: targetPlayer ? targetPlayer.name : null,
      whoStartsFirstId: room.firstGuesserId,
      whoStartsFirstName: firstGuesser ? firstGuesser.name : null,
      isPaused: room.isPaused,
      pauseMessage: room.pauseMessage,
    };
  }
}
