export type GameStatus =
  | 'lobby'
  | 'setter_selection'
  | 'wheel_spinning'
  | 'guessing'
  | 'round_result'
  | 'final_result';

export type GuessEvaluation = 'HIGHER' | 'LOWER' | 'CORRECT';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  score: number;
  avatarColor: string;
  isHost: boolean;
  roundWins: number;
}

export interface GuessRecord {
  id: string;
  playerId: string;
  playerName: string;
  guess: number;
  result: GuessEvaluation;
  round: number;
  timestamp: number;
  targetPlayerName?: string;
}

export interface WheelData {
  selectedPlayerId: string;
  selectedPlayerName: string;
  eligiblePlayers: {
    id: string;
    name: string;
    avatarColor: string;
  }[];
  spinDurationMs: number;
  spinTargetDegrees: number; // exact final rotation angle so wheel stops on selected player
  purpose?: 'setter' | 'first_guesser';
}

export interface RoundWinner {
  playerId: string;
  playerName: string;
  secretNumber: number;
  scoreAwarded: number;
  incorrectGuessesInRound: number;
  targetPlayerName?: string;
}

export interface FinalRanking {
  playerId: string;
  name: string;
  score: number;
  roundWins: number;
  avatarColor: string;
  rank: number;
}

export interface FinalResults {
  rankings: FinalRanking[];
  isDraw: boolean;
  winnerNames: string[];
}

export interface ClientRoomState {
  code: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  round: number;
  maxRounds: number;
  setterId: string | null;
  setterName: string | null;
  currentGuesserId: string | null;
  currentGuesserName: string | null;
  possibleMin: number;
  possibleMax: number;
  guesses: GuessRecord[];
  turnExpiresAt: number | null;
  turnDuration: number;
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
  // Personalized state for the requesting player
  myLockedSecret: number | null;
  hasLockedSecret: boolean;
  allSecretsLocked: boolean;
  lockedPlayersCount: number;
  totalPlayersCount: number;
  targetOpponentName: string | null;
  whoStartsFirstId: string | null;
  whoStartsFirstName: string | null;
  // If paused due to player count < 2
  isPaused: boolean;
  pauseMessage: string | null;
}

export interface SocketErrorPayload {
  message: string;
  code?: string;
}
