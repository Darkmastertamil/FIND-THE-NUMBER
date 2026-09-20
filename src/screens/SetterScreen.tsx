import React, { useState } from 'react';
import { Lock, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
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
  const isSetter = room.setterId === currentUserId;
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

  const isLocked = lockedLocally !== null || room.myLockedSecret !== null;
  const displayedLockedSecret = lockedLocally || room.myLockedSecret;

  if (isSetter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full my-auto">
        <div className="w-full bg-white/95 border-2 border-amber-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-100/50 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-mono text-xs font-bold tracking-wider uppercase mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>YOU ARE THE NUMBER SETTER</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-wide">
            Choose a secret number
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1 font-medium">
            Range: <span className="text-amber-600 font-bold">1 – 1000</span>
          </p>

          {isLocked ? (
            <div className="my-8 p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center animate-scale-in">
              <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-mono font-bold uppercase mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Secret Number Locked!</span>
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-amber-700 tracking-widest my-2">
                {displayedLockedSecret}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-3 font-medium">
                Preparing the Guessing Spin Wheel...
              </p>
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
                  className="w-full py-4 px-4 rounded-2xl bg-amber-50/50 border-2 border-amber-200 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 text-center text-4xl sm:text-5xl font-mono font-black text-amber-800 transition outline-none"
                />
              </div>

              {/* Slider for easy mobile adjustment */}
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
                  className="w-full h-2.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
                    className="px-3 py-1 rounded-xl bg-amber-100/70 hover:bg-amber-200 text-amber-800 text-xs font-mono font-bold transition shadow-2xs"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                id="lock-secret-number-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-300 to-rose-300 hover:opacity-95 text-amber-950 font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-amber-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-amber-950" />
                <span>{isLoading ? 'Locking Secret...' : 'LOCK SECRET NUMBER'}</span>
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-400 font-mono mt-4 font-medium">
            Security Guarantee: Secret numbers are encrypted on the server and never revealed to guessers.
          </p>
        </div>
      </div>
    );
  }

  // Guessers Spectator View
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full my-auto">
      <div className="w-full bg-white/95 border border-purple-200 rounded-3xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse shadow-inner">
          🔐
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs uppercase font-bold mb-3">
          <span>Number Setter Phase</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-800">
          <span className="text-amber-600">{room.setterName || 'The Setter'}</span> is choosing the secret number...
        </h2>

        <p className="text-xs font-mono text-slate-500 mt-2 max-w-xs mx-auto font-medium">
          The secret will be between <span className="text-purple-600 font-bold">1 and 1000</span>.
          Get ready for the Guesser Spin Wheel!
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-purple-600 text-xs font-mono font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
          <span>Waiting for secret to be locked...</span>
        </div>
      </div>
    </div>
  );
};
