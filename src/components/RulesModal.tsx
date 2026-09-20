import React from 'react';
import { X, Trophy, Target, RotateCcw, Clock, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white/98 border border-purple-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-rules-btn"
          onClick={onClose}
          aria-label="Close rules"
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-50 text-purple-600 hover:text-purple-900 hover:bg-purple-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-purple-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-200 via-purple-200 to-sky-200 flex items-center justify-center text-xl shadow-xs">
            🎯
          </div>
          <div>
            <h2 id="rules-title" className="text-xl font-bold font-mono text-slate-800 tracking-wide">
              HOW TO PLAY
            </h2>
            <p className="text-xs text-purple-600 font-mono font-medium">Game Rules & Fair Play Guide</p>
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
            <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-bold text-slate-800">Spin Wheel Chooses Who Guesses First (5s)</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                At the start of each round, the animated spin wheel spins for <span className="text-purple-800 font-mono font-bold">5 seconds</span> to choose which player starts the guessing phase!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-bold text-slate-800">Both Players Choose Secrets Simultaneously</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Both players lock in their secret number between <span className="text-indigo-900 font-mono font-bold">1 and 1000</span> simultaneously. Secrets remain encrypted and hidden from opponents.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-pink-50/50 border border-pink-100">
            <span className="w-6 h-6 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-bold text-slate-800">Turn-Based Guessing Duel (30s Turns)</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Player 1 takes a guess at Player 2's secret, then Player 2 guesses at Player 1's secret. You have <span className="text-pink-700 font-mono font-bold">30 seconds</span> for each guess!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/50 border border-teal-100">
            <span className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-bold text-slate-800">Higher & Lower Clues</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1 border border-emerald-200">
                  <ArrowUp className="w-3.5 h-3.5" /> HIGHER
                </span>
                <span className="text-slate-500 font-medium">Secret is greater than guess</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold flex items-center gap-1 border border-sky-200">
                  <ArrowDown className="w-3.5 h-3.5" /> LOWER
                </span>
                <span className="text-slate-500 font-medium">Secret is smaller than guess</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/50 border border-sky-100">
            <span className="w-6 h-6 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              5
            </span>
            <div>
              <p className="font-bold text-slate-800">Dynamic Scoring System</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                The player who finds the exact secret number wins the round. Base score is <span className="text-purple-700 font-mono font-bold">100 points</span>, minus <span className="text-rose-600 font-mono font-bold">5 points</span> per incorrect guess made by anyone in that round (min 10 pts).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5">
              6
            </span>
            <div>
              <p className="font-bold text-slate-800">5-Round Match & Rematch</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                A full match lasts <span className="text-indigo-700 font-bold">5 rounds</span> with rotating roles. Highest total score wins the tournament! Ties result in an honorable draw.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Server-Authoritative Anti-Cheat</span>
          </div>
          <button
            id="got-it-rules-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 hover:opacity-95 text-white font-bold font-mono text-xs transition cursor-pointer shadow-xs"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
