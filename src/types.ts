export type GameStatus =
  | 'lobby'
  | 'setter_selection'
  | 'wheel_spinning'
  | 'guessing'
  | 'round_result'
  | 'powerup_wheel'
  | 'final_result';

export type GuessEvaluation = 'HIGHER' | 'LOWER' | 'CORRECT';

export type PowerUpId =
  | 'blind_opponent'
  | 'change_number'
  | 'parity_clue'
  | 'range_snip'
  | 'time_squeeze'
  | 'shield';

export interface PowerUpDefinition {
  id: PowerUpId;
  name: string;
  icon: string; // emoji
  description: string;
  color: string;
  badgeBg: string;
}

export const POWER_UP_LIST: PowerUpDefinition[] = [
  {
    id: 'blind_opponent',
    name: 'Smoke Blind',
    icon: '🌫️',
    description: 'Obscures opponent’s search range and slider in heavy fog for their next turn.',
    color: '#64748b', // Slate
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'change_number',
    name: 'Secret Shift',
    icon: '🔄',
    description: 'Change your secret number to a new integer (1–1000) mid-match!',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'parity_clue',
    name: 'Parity Clue',
    icon: '🔍',
    description: 'Immediately reveals whether opponent’s secret number is EVEN or ODD!',
    color: '#0284c7', // Sky blue
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  {
    id: 'range_snip',
    name: '50% Range Snip',
    icon: '✂️',
    description: 'Slices away 50% of the wrong search numbers, zooming closer to the secret!',
    color: '#10b981', // Emerald
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'time_squeeze',
    name: 'Time Squeeze',
    icon: '⏳',
    description: 'Compresses opponent’s next turn to just 10 seconds of high pressure!',
    color: '#f59e0b', // Amber
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'shield',
    name: 'Energy Shield',
    icon: '🛡️',
    description: 'Blocks the next negative attack (Blind or Time Squeeze) cast by opponent.',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-300',
  },
];

export interface PowerUpWheelData {
  awardedPlayerId: string;
  awardedPlayerName: string;
  powerUpId: PowerUpId;
  powerUpName: string;
  powerUpDescription: string;
  spinDurationMs: number;
  spinTargetDegrees: number;
  items: {
    id: PowerUpId;
    name: string;
    icon: string;
    color: string;
  }[];
}

export interface PlayerActiveEffects {
  isBlinded: boolean;
  isShielded: boolean;
  parityClue: 'EVEN' | 'ODD' | null;
  isTimeSqueezed: boolean;
}

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
  // Power-Ups and Effects
  powerUpWheelData: PowerUpWheelData | null;
  myPowerUps: PowerUpId[];
  myActiveEffects: PlayerActiveEffects;
  opponentActiveEffects: { isBlinded: boolean; isShielded: boolean };
  recentPowerUpLog: { message: string; timestamp: number } | null;
  // If paused due to player count < 2
  isPaused: boolean;
  pauseMessage: string | null;
}

export interface SocketErrorPayload {
  message: string;
  code?: string;
}
