import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { ClientRoomState } from '../types';
import { Leaderboard } from '../components/Leaderboard';
import { soundManager } from '../utils/audio';

interface RoundResultScreenProps {
  room: ClientRoomState;
  currentUserId: string;
  onNextRound: () => void;
  onSpinPowerUpWheel: () => void;
  isLoading: boolean;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  room,
  currentUserId,
  onNextRound,
  onSpinPowerUpWheel,
  isLoading,
}) => {
  const isHost = room.hostId === currentUserId;
  const winner = room.roundWinner;
  const isMeWinner = winner?.playerId === currentUserId;

  useEffect(() => {
    soundManager.playCorrect();
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'],
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full my-auto">
      <div className="w-full bg-white/95 border-2 border-emerald-300/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-100/50 text-center">
        {/* Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-mono text-xs font-black tracking-widest uppercase mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ROUND {room.round} COMPLETE!</span>
        </div>

        {/* Winner Name */}
        <div className="my-2">
          <p className="text-xs font-mono uppercase text-slate-400 font-bold">Round Winner</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Trophy className="w-7 h-7 text-amber-500 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-slate-800 tracking-wide">
              {winner?.playerName}
            </h2>
            <Trophy className="w-7 h-7 text-amber-500 animate-bounce" />
          </div>
          {isMeWinner && (
            <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200 shadow-2xs">
              🎉 YOU FOUND THE NUMBER!
            </span>
          )}
        </div>

        {/* Secret Number Reveal Card */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-sky-50/50 border border-emerald-200 flex items-center justify-around shadow-inner">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
              Secret Number
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-teal-700 tracking-wider">
              {winner?.secretNumber}
            </span>
          </div>

          <div className="h-10 w-px bg-emerald-200/80" />

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
              Points Awarded
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-700 tracking-wider">
              +{winner?.scoreAwarded}
            </span>
          </div>
        </div>

        {/* Scoring Breakdown notice */}
        <p className="text-[11px] font-mono text-slate-500 mb-5 font-medium">
          Score Formula: 100 Base − ({winner?.incorrectGuessesInRound} wrong guesses × 5) = {winner?.scoreAwarded} pts.
        </p>

        {/* Current Leaderboard */}
        <div className="my-4">
          <Leaderboard
            players={room.players}
            currentUserId={currentUserId}
          />
        </div>

        {/* Next Round Action */}
        <div className="mt-6 space-y-2.5">
          {room.round < room.maxRounds ? (
            isHost ? (
              <>
                <button
                  id="spin-powerup-wheel-btn"
                  onClick={onSpinPowerUpWheel}
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition shadow-lg shadow-amber-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
                  <span>{isLoading ? 'Spinning...' : '🎡 SPIN POWER-UP WHEEL (Random Player Bonus!)'}</span>
                </button>

                <button
                  id="skip-to-round-btn"
                  onClick={onNextRound}
                  disabled={isLoading}
                  className="text-xs font-mono text-slate-400 hover:text-slate-600 transition underline cursor-pointer"
                >
                  Skip bonus & start Round {room.round + 1} directly →
                </button>
              </>
            ) : (
              <div className="py-3 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                <span>Waiting for host to spin the Power-Up Wheel for Round {room.round + 1}...</span>
              </div>
            )
          ) : (
            <button
              id="view-final-results-btn"
              onClick={onNextRound}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:opacity-95 text-amber-950 font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-amber-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-950" />
              <span>VIEW FINAL RESULTS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
