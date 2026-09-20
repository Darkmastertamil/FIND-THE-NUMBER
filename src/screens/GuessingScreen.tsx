import React, { useState, useEffect } from 'react';
import { Target, ArrowUp, ArrowDown, AlertCircle, Send, Lock, ShieldCheck } from 'lucide-react';
import { ClientRoomState } from '../types';
import { TimerBar } from '../components/TimerBar';
import { RangeVisualizer } from '../components/RangeVisualizer';
import { GuessHistory } from '../components/GuessHistory';
import { Leaderboard } from '../components/Leaderboard';
import { soundManager } from '../utils/audio';

interface GuessingScreenProps {
  room: ClientRoomState;
  currentUserId: string;
  onSubmitGuess: (guess: number) => void;
  isLoading: boolean;
  actionError: string | null;
  onClearActionError: () => void;
}

export const GuessingScreen: React.FC<GuessingScreenProps> = ({
  room,
  currentUserId,
  onSubmitGuess,
  isLoading,
  actionError,
  onClearActionError,
}) => {
  const isMyTurn = room.currentGuesserId === currentUserId;
  const targetOpponent = room.targetOpponentName || 'Opponent';

  const [guessInput, setGuessInput] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Play sound effect when lastGuessResult changes
  useEffect(() => {
    if (room.lastGuessResult) {
      if (room.lastGuessResult.result === 'HIGHER') {
        soundManager.playHigher();
      } else if (room.lastGuessResult.result === 'LOWER') {
        soundManager.playLower();
      }
    }
  }, [room.lastGuessResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearActionError();

    if (!isMyTurn) {
      setLocalError('It is not your turn to guess.');
      return;
    }

    const parsed = parseInt(guessInput.trim(), 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1000) {
      setLocalError('Please enter a valid whole number between 1 and 1000.');
      return;
    }

    // Client-side check for duplicate guess by the same user in current round
    const alreadyGuessed = room.guesses.some(
      (g) => g.playerId === currentUserId && g.guess === parsed && g.round === room.round
    );
    if (alreadyGuessed) {
      setLocalError('⚠️ You already guessed that number in this round.');
      return;
    }

    setLocalError(null);
    onSubmitGuess(parsed);
    setGuessInput('');
  };

  const error = localError || actionError;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 max-w-4xl mx-auto w-full space-y-4">
      {/* Top Status Bar: Your own secret number protected */}
      {room.myLockedSecret !== null && (
        <div className="w-full max-w-lg p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-mono flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Your Secret Number (Opponents guess this):</span>
          </div>
          <span className="text-base font-black text-purple-950 px-3 py-0.5 rounded-xl bg-white border border-purple-300 shadow-2xs">
            {room.myLockedSecret}
          </span>
        </div>
      )}

      {/* Dynamic Feedback Banner for Last Guess (HIGHER / LOWER) */}
      {room.lastGuessResult && (
        <div
          className={`w-full max-w-lg p-3 sm:p-4 rounded-3xl border text-center transition-all animate-scale-in shadow-md ${
            room.lastGuessResult.result === 'HIGHER'
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-emerald-200 text-emerald-800'
              : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-sky-200 text-sky-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-600 font-medium">
            <span className="font-bold text-slate-800">{room.lastGuessResult.playerName}</span> guessed{' '}
            <span className="px-2.5 py-0.5 rounded-xl bg-white border border-slate-200 font-mono font-black text-slate-800 text-sm shadow-2xs">
              {room.lastGuessResult.guess}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-center gap-2 font-mono font-black text-2xl sm:text-3xl tracking-wider">
            {room.lastGuessResult.result === 'HIGHER' ? (
              <>
                <ArrowUp className="w-7 h-7 text-emerald-600 animate-bounce" />
                <span className="text-emerald-700">🔼 HIGHER!</span>
                <ArrowUp className="w-7 h-7 text-emerald-600 animate-bounce" />
              </>
            ) : (
              <>
                <ArrowDown className="w-7 h-7 text-sky-600 animate-bounce" />
                <span className="text-sky-700">🔽 LOWER!</span>
                <ArrowDown className="w-7 h-7 text-sky-600 animate-bounce" />
              </>
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1 font-semibold">
            {room.lastGuessResult.result === 'HIGHER'
              ? 'The secret number is GREATER than this guess.'
              : 'The secret number is SMALLER than this guess.'}
          </p>
        </div>
      )}

      {/* Turn status header */}
      <div className="w-full max-w-lg text-center">
        {isMyTurn ? (
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-100/90 border-2 border-purple-400 text-purple-800 font-mono text-sm font-black tracking-widest uppercase shadow-md shadow-purple-100 animate-pulse">
            <Target className="w-4 h-4 text-purple-700" />
            <span>YOUR TURN TO GUESS (30s)!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-200 text-slate-600 font-mono text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span>
              🎯 <strong className="text-slate-800">{room.currentGuesserName || 'Opponent'}</strong> is guessing (30s)...
            </span>
          </div>
        )}
      </div>

      {/* 30-second Authoritative Timer */}
      <TimerBar
        expiresAt={room.turnExpiresAt}
        durationMs={room.turnDuration}
        isCurrentUser={isMyTurn}
      />

      {/* Possible Range Visualization for Your Target Guess */}
      <div className="w-full max-w-lg">
        <p className="text-xs font-mono text-slate-500 text-center mb-1 font-semibold">
          Your Search Range for {targetOpponent}'s Secret:
        </p>
        <RangeVisualizer
          possibleMin={room.possibleMin}
          possibleMax={room.possibleMax}
          lastGuess={room.lastGuessResult?.guess}
        />
      </div>

      {/* Guess Input Form for Active Guesser */}
      {isMyTurn ? (
        <div className="w-full max-w-lg bg-white/95 border-2 border-purple-300 rounded-3xl p-5 shadow-xl shadow-purple-100/60">
          {error && (
            <div className="mb-3 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center justify-between animate-shake">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setLocalError(null);
                  onClearActionError();
                }}
                className="text-rose-400 hover:text-rose-700 ml-2 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                id="active-guess-input"
                type="number"
                min={room.possibleMin}
                max={room.possibleMax}
                value={guessInput}
                onChange={(e) => {
                  setGuessInput(e.target.value);
                  if (error) {
                    setLocalError(null);
                    onClearActionError();
                  }
                }}
                placeholder={`Guess ${targetOpponent}'s number (${room.possibleMin} – ${room.possibleMax})`}
                disabled={isLoading}
                autoFocus
                className="w-full py-3.5 px-4 rounded-2xl bg-purple-50/50 border-2 border-purple-200 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 text-center text-3xl font-mono font-black text-purple-800 placeholder-purple-300 transition outline-none"
              />
            </div>

            {/* Quick Helper buttons for Midpoint calculation */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-medium">Binary search midpoint:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setGuessInput(
                      Math.floor((room.possibleMin + room.possibleMax) / 2).toString()
                    )
                  }
                  className="px-3 py-1 rounded-xl bg-purple-100/70 hover:bg-purple-200 text-purple-700 text-xs font-mono font-bold border border-purple-200 transition cursor-pointer shadow-2xs"
                >
                  Midpoint: {Math.floor((room.possibleMin + room.possibleMax) / 2)}
                </button>
              </div>
            </div>

            <button
              id="submit-guess-btn"
              type="submit"
              disabled={isLoading || !guessInput.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 hover:opacity-95 text-white font-mono font-black text-sm uppercase tracking-wider transition shadow-md shadow-pink-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
              <span>{isLoading ? 'Checking Guess...' : 'SUBMIT GUESS'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-lg p-4 rounded-2xl bg-white/90 border border-purple-150 text-center text-slate-500 font-mono text-xs shadow-xs font-medium">
          Waiting for <strong className="text-slate-700">{room.currentGuesserName || 'opponent'}</strong>. You alternate 30-second guesses!
        </div>
      )}

      {/* Lower Section: Guess History and Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl pt-2">
        <GuessHistory guesses={room.guesses} currentRound={room.round} />
        <Leaderboard
          players={room.players}
          currentSetterId={room.setterId}
          currentGuesserId={room.currentGuesserId}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};
