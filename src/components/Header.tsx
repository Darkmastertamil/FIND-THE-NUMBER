import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, LogOut, Radio } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  roomCode?: string;
  round?: number;
  maxRounds?: number;
  connected: boolean;
  onOpenRules: () => void;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  round,
  maxRounds = 5,
  connected,
  onOpenRules,
  onLeaveRoom,
}) => {
  const [muted, setMuted] = useState(soundManager.isMuted());
  const [copied, setCopied] = useState(false);

  const handleToggleSound = () => {
    const isMute = soundManager.toggleMute();
    setMuted(isMute);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-purple-150/80 px-4 py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-300 via-purple-300 to-sky-300 flex items-center justify-center text-lg shadow-sm">
            🎯
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-800 uppercase flex items-center gap-1.5 font-mono">
              Find <span className="text-purple-600">The</span> Number
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Multiplayer Guessing Arena
            </p>
          </div>
        </div>

        {/* Center: Room Code & Round info if in room */}
        {roomCode && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div
              onClick={handleCopyCode}
              id="header-room-code"
              role="button"
              tabIndex={0}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 hover:border-sky-300 hover:bg-sky-100/70 transition-all cursor-pointer shadow-xs"
              title="Click to copy Room Code"
            >
              <span className="text-[10px] text-sky-500 font-mono uppercase tracking-widest hidden xs:inline font-semibold">
                Room
              </span>
              <span className="text-sm sm:text-base font-mono font-bold tracking-widest text-sky-700">
                {roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-600 transition-colors" />
              )}
            </div>

            {round !== undefined && round > 0 && (
              <div className="px-2.5 py-1 rounded-xl bg-purple-100/80 border border-purple-200 text-purple-700 font-mono text-xs font-bold">
                ROUND {round} / {maxRounds}
              </div>
            )}
          </div>
        )}

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold ${
              connected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline">{connected ? 'Online' : 'Reconnecting'}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={handleToggleSound}
            aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-purple-600" />}
          </button>

          {/* Rules Modal Button */}
          <button
            id="rules-modal-btn"
            onClick={onOpenRules}
            aria-label="How to play"
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-semibold"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Leave room */}
          {onLeaveRoom && roomCode && (
            <button
              id="leave-room-btn"
              onClick={onLeaveRoom}
              aria-label="Leave room"
              className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
