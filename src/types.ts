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
  purpose?: 'setter' | 'guesser';
}

export interface RoundWinner {
  playerId: string;
  playerName: string;
  secretNumber: number;
  scoreAwarded: number;
  incorrectGuessesInRound: number;
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
  } | null;
  roundWinner: RoundWinner | null;
  finalResults: FinalResults | null;
  // If the requesting player is the setter, they get their own locked secret back for reference
  myLockedSecret: number | null;
  // If paused due to player count < 2
  isPaused: boolean;
  pauseMessage: string | null;
}

export interface SocketErrorPayload {
  message: string;
  code?: string;
}
