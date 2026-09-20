import React from 'react';
import { Trophy, Crown, Target, Lock } from 'lucide-react';
import { Player } from '../types';

interface LeaderboardProps {
  players: Player[];
  currentSetterId?: string | null;
  currentGuesserId?: string | null;
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  currentSetterId,
  currentGuesserId,
  currentUserId,
}) => {
  // Sort players by score desc, then roundWins desc
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.roundWins - a.roundWins;
  });

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 border border-purple-100 rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3 border-b border-purple-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span className="uppercase tracking-wider">Scoreboard</span>
        </div>
        <span className="text-[11px] text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isUser = player.id === currentUserId;
          const isSetter = player.id === currentSetterId;
          const isGuesser = player.id === currentGuesserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-mono transition-all ${
                isUser
                  ? 'bg-purple-50/80 border border-purple-200 text-purple-900 shadow-xs'
                  : 'bg-slate-50/80 border border-slate-200/70 text-slate-700'
              } ${!player.connected ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 text-center font-black ${
                    index === 0
                      ? 'text-amber-500'
                      : index === 1
                      ? 'text-slate-400'
                      : index === 2
                      ? 'text-amber-700'
                      : 'text-slate-400'
                  }`}
                >
                  {index + 1}
                </span>

                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: player.avatarColor }}
                />

                <span className="font-bold text-slate-800 truncate max-w-[110px]">
                  {player.name}
                </span>

                {isUser && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800 font-bold">
                    YOU
                  </span>
                )}

                {/* Role tags */}
                {isSetter && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold"
                    title="Number Setter"
                  >
                    <Lock className="w-2.5 h-2.5" /> Setter
                  </span>
                )}

                {isGuesser && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold"
                    title="Current Guesser"
                  >
                    <Target className="w-2.5 h-2.5 animate-spin" /> Guesser
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {player.roundWins} {player.roundWins === 1 ? 'win' : 'wins'}
                </span>
                <span className="text-sm font-black text-purple-700 font-mono tracking-wider">
                  {player.score} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
