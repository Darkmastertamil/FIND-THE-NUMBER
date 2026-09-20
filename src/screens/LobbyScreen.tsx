import React, { useState } from 'react';
import { Copy, Check, Users, Crown, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { ClientRoomState } from '../types';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface LobbyScreenProps {
  room: ClientRoomState;
  currentUserId: string;
  onStartGame: () => void;
  isLoading: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  currentUserId,
  onStartGame,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === currentUserId;
  const connectedPlayers = room.players.filter((p) => p.connected);
  const canStart = isHost && connectedPlayers.length >= 2 && connectedPlayers.length <= 4;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full my-auto">
      {/* Lobby Header Card */}
      <div className="w-full bg-white/95 border border-purple-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-purple-100/60 text-center">
        <span className="text-[11px] uppercase font-mono tracking-widest text-slate-400 font-bold">
          Game Lobby
        </span>

        {/* Room Code Section */}
        <div className="my-3">
          <p className="text-xs font-mono text-purple-600 uppercase tracking-wider mb-1 font-bold">
            ROOM CODE
          </p>
          <div className="inline-block px-7 py-3 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-sky-50 border-2 border-purple-200 shadow-inner">
            <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.25em] text-purple-800">
              {room.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-2 font-medium">
            Share this code with your friends to join!
          </p>

          <button
            id="copy-room-code-btn"
            onClick={handleCopyCode}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100/70 hover:bg-purple-200/80 border border-purple-200 text-xs font-mono font-bold text-purple-800 transition cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">COPIED ROOM CODE!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-600" />
                <span>COPY ROOM CODE</span>
              </>
            )}
          </button>
        </div>

        {/* Player Counter */}
        <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 font-bold">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="tracking-wider uppercase">PLAYERS</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 font-mono text-xs font-bold">
            {connectedPlayers.length} / 4 PLAYERS
          </span>
        </div>

        {/* Player Roster */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {room.players.map((player) => {
            const isMe = player.id === currentUserId;
            return (
              <div
                key={player.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-purple-50/80 border-purple-300 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <PlayerAvatar
                  player={player}
                  isCurrentUser={isMe}
                  size="md"
                />
              </div>
            );
          })}

          {/* Empty slots placeholders */}
          {Array.from({ length: 4 - room.players.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-purple-200 text-purple-400 font-mono text-xs h-28 bg-purple-50/30"
            >
              <div className="w-9 h-9 rounded-2xl border border-dashed border-purple-300 flex items-center justify-center text-purple-400 font-bold mb-2">
                +
              </div>
              <span className="font-medium">Open Slot</span>
            </div>
          ))}
        </div>

        {/* Minimum players notice */}
        {connectedPlayers.length < 2 && (
          <div className="my-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center justify-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Need at least 2 players to start the game.</span>
          </div>
        )}

        {/* Start Game Action */}
        <div className="mt-6">
          {isHost ? (
            <button
              id="start-game-btn"
              onClick={onStartGame}
              disabled={!canStart || isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-teal-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>{isLoading ? 'Starting...' : 'START GAME'}</span>
            </button>
          ) : (
            <div className="py-3.5 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span>Waiting for host to start the game...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
