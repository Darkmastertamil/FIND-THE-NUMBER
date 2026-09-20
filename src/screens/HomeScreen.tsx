import React, { useState } from 'react';
import { Play, Users, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  initialName: string;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onOpenRules: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  initialName,
  onCreateRoom,
  onJoinRoom,
  isLoading,
  errorMessage,
  onClearError,
  onOpenRules,
}) => {
  const [name, setName] = useState(initialName);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateName = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setLocalError('Please enter your name.');
      return false;
    }
    if (trimmed.length < 2) {
      setLocalError('Name must be at least 2 characters.');
      return false;
    }
    if (trimmed.length > 16) {
      setLocalError('Name cannot exceed 16 characters.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    if (!validateName(name)) return;
    onCreateRoom(name.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    if (!validateName(name)) return;

    const trimmedCode = roomCode.trim();
    if (!trimmedCode) {
      setLocalError('Please enter the 6-digit room code.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setLocalError('Room code must be exactly 6 numeric digits (e.g. 482731).');
      return;
    }

    setLocalError(null);
    onJoinRoom(name.trim(), trimmedCode);
  };

  const error = localError || errorMessage;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full my-auto">
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-300 via-purple-300 to-pink-300 p-0.5 shadow-lg shadow-purple-200/50 mb-3">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-3xl shadow-inner">
            🎯
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-800 uppercase">
          Find <span className="text-purple-600">The</span> Number
        </h1>
        <p className="text-sm font-mono text-slate-500 mt-2 font-medium">
          Think fast. Guess smart. Find the number.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full bg-white/95 border border-purple-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-purple-100/60 backdrop-blur-sm">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setLocalError(null);
                onClearError();
              }}
              className="text-rose-400 hover:text-rose-700 font-bold ml-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Player Name Box */}
        <div className="mb-5">
          <label
            htmlFor="player-name-input"
            className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2"
          >
            👤 Enter your name
          </label>
          <div className="relative">
            <input
              id="player-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="e.g. Maya, Leo, Liam"
              maxLength={16}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:ring-3 focus:ring-purple-100 text-slate-800 font-mono placeholder-slate-400 text-sm transition outline-none"
            />
            <span className="absolute right-3.5 top-3.5 text-[10px] font-mono text-slate-400 font-semibold">
              {name.trim().length}/16
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1.5 font-medium">
            2 to 16 characters. Unique per room.
          </p>
        </div>

        {/* Create / Join Choice */}
        {!isJoining ? (
          <div className="space-y-3">
            <button
              id="create-room-btn"
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isLoading ? 'Creating Room...' : 'Create Room'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-purple-100" />
              <span className="flex-shrink mx-3 text-purple-400 text-xs font-mono font-bold">OR</span>
              <div className="flex-grow border-t border-purple-100" />
            </div>

            <button
              id="show-join-btn"
              onClick={() => {
                setIsJoining(true);
                setLocalError(null);
              }}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-mono font-bold text-sm tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>Join Room</span>
            </button>
          </div>
        ) : (
          /* Join Room Form */
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="room-code-input"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                🔢 Enter 6-digit room code
              </label>
              <input
                id="room-code-input"
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={roomCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setRoomCode(cleaned);
                  if (localError) setLocalError(null);
                }}
                placeholder="482731"
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:ring-3 focus:ring-purple-100 text-center text-2xl tracking-[0.3em] font-mono font-black text-purple-700 placeholder-purple-300 transition outline-none"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsJoining(false);
                  setLocalError(null);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition cursor-pointer"
              >
                Back
              </button>
              <button
                id="submit-join-room-btn"
                type="submit"
                disabled={isLoading || roomCode.length !== 6}
                className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:opacity-95 text-white font-mono font-black text-xs uppercase tracking-wider transition shadow-md shadow-sky-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isLoading ? 'Joining...' : 'Join Room'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Rules link & features footer */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={onOpenRules}
          className="text-xs font-mono text-purple-600 hover:text-purple-800 font-bold underline underline-offset-4 cursor-pointer"
        >
          View Game Rules & Scoring
        </button>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mt-1 font-medium">
          <span className="bg-white px-2.5 py-1 rounded-full border border-purple-100 shadow-xs">👥 2–4 Players</span>
          <span className="bg-white px-2.5 py-1 rounded-full border border-purple-100 shadow-xs">⏱️ 15s Turns</span>
          <span className="bg-white px-2.5 py-1 rounded-full border border-purple-100 shadow-xs">🎡 Fair Spin Wheel</span>
        </div>
      </div>
    </div>
  );
};
