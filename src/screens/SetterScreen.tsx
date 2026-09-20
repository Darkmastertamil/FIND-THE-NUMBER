import React, { useState } from 'react';
import { Lock, CheckCircle2, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { ClientRoomState } from '../types';

interface SetterScreenProps {
  room: ClientRoomState;
  currentUserId: string;
  onLockSecret: (secret: number) => void;
  isLoading: boolean;
}

export const SetterScreen: React.FC<SetterScreenProps> = ({
  room,
  currentUserId,
  onLockSecret,
  isLoading,
}) => {
  const [secretInput, setSecretInput] = useState<string>('500');
  const [error, setError] = useState<string | null>(null);
  const [lockedLocally, setLockedLocally] = useState<number | null>(room.myLockedSecret);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(secretInput, 10);

    if (isNaN(val)) {
      setError('Please enter a valid integer.');
      return;
    }
    if (val < 1 || val > 1000) {
      setError('Secret number must be between 1 and 1000.');
      return;
    }

    setError(null);
    setLockedLocally(val);
    onLockSecret(val);
  };

  const isLocked = lockedLocally !== null || room.hasLockedSecret || room.myLockedSecret !== null;
  const displayedLockedSecret = lockedLocally || room.myLockedSecret;
  const targetOpponent = room.targetOpponentName || 'Opponent';
  const whoStartsFirst = room.whoStartsFirstName || 'First player';
  const isMeStartingFirst = room.whoStartsFirstId === currentUserId;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full my-auto">
      <div className="w-full bg-white/95 border-2 border-purple-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-100/50 text-center">
        {/* Turn order indicator from the wheel spin */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-mono text-xs font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>
            {isMeStartingFirst ? '⚡ You will guess first!' : `⚡ ${whoStartsFirst} will guess first!`}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-wide">
          Choose Your Secret Number
        </h2>
        <p className="text-xs font-mono text-slate-500 mt-1 font-medium">
          {targetOpponent} will try to guess this number (Range: <span className="text-purple-600 font-bold">1 – 1000</span>)
        </p>

        {isLocked ? (
          <div className="my-6 p-6 rounded-2xl bg-purple-50/70 border border-purple-200 text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-mono font-bold uppercase mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your Secret Is Locked!</span>
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-black text-purple-700 tracking-widest my-2">
              {displayedLockedSecret}
            </div>

            {/* Waiting for other player */}
            <div className="mt-4 pt-4 border-t border-purple-200/60 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-slate-600">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>
                  Ready: {room.lockedPlayersCount} / {room.totalPlayersCount || 2} players locked
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                Waiting for {targetOpponent} to lock their number...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center justify-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Number Input Box */}
            <div>
              <input
                id="secret-number-input"
                type="number"
                min="1"
                max="1000"
                step="1"
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                autoFocus
                className="w-full py-4 px-4 rounded-2xl bg-purple-50/50 border-2 border-purple-200 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100 text-center text-4xl sm:text-5xl font-mono font-black text-purple-900 transition outline-none"
              />
            </div>

            {/* Slider for easy adjustment */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max="1000"
                value={parseInt(secretInput, 10) || 500}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-2.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold mt-1">
                <span>1</span>
                <span>500</span>
                <span>1000</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex justify-center gap-2">
              {[100, 250, 500, 750, 999].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSecretInput(preset.toString())}
                  className="px-3 py-1 rounded-xl bg-purple-100/70 hover:bg-purple-200 text-purple-800 text-xs font-mono font-bold transition shadow-2xs"
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              id="lock-secret-number-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-purple-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-white" />
              <span>{isLoading ? 'Locking Secret...' : 'LOCK SECRET NUMBER'}</span>
            </button>
          </form>
        )}

        <p className="text-[11px] text-slate-400 font-mono mt-4 font-medium">
          🔒 Both players choose a secret. Then you take turns guessing each other's number with 30s per guess!
        </p>
      </div>
    </div>
  );
};
