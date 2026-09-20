import React from 'react';
import { ArrowUp, ArrowDown, CheckCircle2, History } from 'lucide-react';
import { GuessRecord } from '../types';

interface GuessHistoryProps {
  guesses: GuessRecord[];
  currentRound: number;
}

export const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses, currentRound }) => {
  const roundGuesses = guesses.filter((g) => g.round === currentRound);

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 border border-purple-100 rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3 border-b border-purple-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold">
          <History className="w-3.5 h-3.5 text-purple-500" />
          <span className="uppercase tracking-wider">Round Guess History</span>
        </div>
        <span className="text-[11px] text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          {roundGuesses.length} {roundGuesses.length === 1 ? 'guess' : 'guesses'}
        </span>
      </div>

      {roundGuesses.length === 0 ? (
        <div className="py-6 text-center text-slate-400 font-mono text-xs">
          No guesses submitted yet for this round.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {roundGuesses
            .slice()
            .reverse()
            .map((item, index) => {
              const isCorrect = item.result === 'CORRECT';
              const isHigher = item.result === 'HIGHER';

              return (
                <div
                  key={item.id || index}
                  className={`flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-mono transition-all ${
                    isCorrect
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs'
                      : isHigher
                      ? 'bg-emerald-50/50 border border-emerald-150 text-slate-700'
                      : 'bg-sky-50/50 border border-sky-150 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px] font-bold">#{roundGuesses.length - index}</span>
                    <span className="font-bold text-slate-800">{item.playerName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-800 tracking-wider px-2 py-0.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      {item.guess}
                    </span>

                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center gap-1 text-[11px] border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CORRECT!
                      </span>
                    ) : isHigher ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 text-[11px] border border-emerald-200">
                        <ArrowUp className="w-3.5 h-3.5" /> HIGHER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center gap-1 text-[11px] border border-sky-200">
                        <ArrowDown className="w-3.5 h-3.5" /> LOWER
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
