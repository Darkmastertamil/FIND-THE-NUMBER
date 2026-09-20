import React from 'react';
import { Crown, Lock, Target } from 'lucide-react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  isSetter?: boolean;
  isCurrentGuesser?: boolean;
  isCurrentUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isSetter = false,
  isCurrentGuesser = false,
  isCurrentUser = false,
  size = 'md',
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
  }[size];

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Outer Glow container */}
      <div
        className={`relative ${sizeClasses} rounded-2xl flex items-center justify-center font-mono font-bold transition-all duration-300 shadow-xs ${
          !player.connected ? 'opacity-40 grayscale' : ''
        } ${
          isCurrentGuesser
            ? 'ring-3 ring-sky-400 ring-offset-2 ring-offset-white shadow-md animate-pulse'
            : isSetter
            ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-white shadow-md'
            : 'border border-slate-200'
        }`}
        style={{
          backgroundColor: `${player.avatarColor}25`,
          borderColor: player.avatarColor,
          color: player.avatarColor,
        }}
      >
        <span className="font-black drop-shadow-xs">{getInitials(player.name)}</span>

        {/* Host Crown */}
        {player.isHost && (
          <span
            className="absolute -top-2 -right-1 p-0.5 rounded-full bg-amber-400 text-amber-950 shadow-xs"
            title="Host"
          >
            <Crown className="w-3 h-3" />
          </span>
        )}

        {/* Setter Lock */}
        {isSetter && (
          <span
            className="absolute -top-2 -left-1 p-0.5 rounded-full bg-amber-400 text-amber-950 shadow-xs"
            title="Number Setter"
          >
            <Lock className="w-3 h-3" />
          </span>
        )}

        {/* Current Guesser Crosshair */}
        {isCurrentGuesser && (
          <span
            className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-sky-400 text-sky-950 shadow-xs"
            title="Active Guesser"
          >
            <Target className="w-3 h-3 animate-spin" />
          </span>
        )}

        {/* Connection status indicator */}
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            player.connected ? 'bg-emerald-500' : 'bg-rose-400'
          }`}
          title={player.connected ? 'Online' : 'Disconnected'}
        />
      </div>

      {/* Player name & score */}
      <div className="mt-1.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-[85px]">
            {player.name}
          </p>
          {isCurrentUser && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
              YOU
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono font-black text-purple-700">
          {player.score} <span className="text-[9px] text-slate-400 font-normal">pts</span>
        </p>
      </div>
    </div>
  );
};
