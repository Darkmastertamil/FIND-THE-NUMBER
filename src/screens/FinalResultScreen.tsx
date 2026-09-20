import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Medal, Sparkles, Users } from 'lucide-react';
import { ClientRoomState } from '../types';
import { soundManager } from '../utils/audio';

interface FinalResultScreenProps {
  room: ClientRoomState;
  currentUserId: string;
  onRematch: () => void;
  isLoading: boolean;
}

export const FinalResultScreen: React.FC<FinalResultScreenProps> = ({
  room,
  currentUserId,
  onRematch,
  isLoading,
}) => {
  const isHost = room.hostId === currentUserId;
  const results = room.finalResults;

  useEffect(() => {
    soundManager.playCorrect();
    // Big confetti blast
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    const fire = (particleRatio: number, opts: any) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const rankings = results?.rankings || [];
  const isDraw = results?.isDraw || false;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'text-amber-600', label: '1st' };
    if (rank === 2) return { icon: '🥈', color: 'text-slate-600', label: '2nd' };
    if (rank === 3) return { icon: '🥉', color: 'text-amber-700', label: '3rd' };
    return { icon: `#${rank}`, color: 'text-slate-400', label: `${rank}th` };
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full my-auto">
      <div className="w-full bg-white/95 border-2 border-purple-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-100/60 text-center">
        {/* Match Completed Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 font-mono text-xs font-black tracking-widest uppercase mb-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>MATCH COMPLETE • 5 ROUNDS</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-800 uppercase mt-1">
          Game Over
        </h1>

        {/* Draw or Winner Banner */}
        <div className="my-4">
          {isDraw ? (
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-center animate-scale-in">
              <span className="text-3xl">🤝</span>
              <h2 className="text-2xl font-black font-mono text-purple-900 tracking-wider mt-1">
                IT'S A DRAW!
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-1 font-medium">
                Tied between: <strong className="text-slate-800">{results?.winnerNames.join(' & ')}</strong>
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 text-center animate-scale-in shadow-xs">
              <span className="text-3xl">👑</span>
              <p className="text-xs font-mono uppercase text-amber-700 tracking-widest mt-1 font-bold">
                Tournament Champion
              </p>
              <h2 className="text-3xl font-black font-mono text-amber-950 tracking-wider mt-1">
                {results?.winnerNames[0]}
              </h2>
            </div>
          )}
        </div>

        {/* Final Rankings List */}
        <div className="my-5 space-y-2.5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 text-left px-1 font-bold">
            FINAL RESULTS
          </p>

          {rankings.map((entry) => {
            const badge = getRankBadge(entry.rank);
            const isMe = entry.playerId === currentUserId;

            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  entry.rank === 1
                    ? 'bg-amber-50/70 border-amber-300/80 shadow-2xs'
                    : isMe
                    ? 'bg-purple-50/80 border-purple-300'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{badge.icon}</span>

                  <div
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                    style={{ backgroundColor: entry.avatarColor }}
                  />

                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-sm text-slate-800">
                        {entry.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono font-bold border border-purple-200">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {entry.roundWins} {entry.roundWins === 1 ? 'round win' : 'round wins'}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xl font-black text-amber-600 tracking-wider">
                    {entry.score}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1 font-bold">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rematch Action */}
        <div className="mt-6">
          <button
            id="rematch-btn"
            onClick={onRematch}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-400 to-rose-400 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-pink-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span>{isLoading ? 'Resetting Match...' : 'PLAY AGAIN (REMATCH)'}</span>
          </button>
          <p className="text-[11px] font-mono text-slate-400 mt-2 font-medium">
            Rematch keeps all players in this room and starts fresh from Round 1.
          </p>
        </div>
      </div>
    </div>
  );
};
