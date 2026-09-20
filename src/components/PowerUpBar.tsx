import React, { useState } from 'react';
import { Sparkles, Shield, Zap, RefreshCw, EyeOff, Clock, HelpCircle, X, Check } from 'lucide-react';
import { PowerUpId, POWER_UP_LIST, PlayerActiveEffects } from '../types';

interface PowerUpBarProps {
  myPowerUps: PowerUpId[];
  myActiveEffects?: PlayerActiveEffects;
  opponentActiveEffects?: { isBlinded: boolean; isShielded: boolean };
  targetOpponentName: string;
  onUsePowerUp: (powerUpId: PowerUpId, newSecret?: number) => void;
  isLoading: boolean;
  recentPowerUpLog?: { message: string; timestamp: number } | null;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  myPowerUps,
  myActiveEffects,
  opponentActiveEffects,
  targetOpponentName,
  onUsePowerUp,
  isLoading,
  recentPowerUpLog,
}) => {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpId | null>(null);
  const [newSecretInput, setNewSecretInput] = useState<string>('');
  const [changeError, setChangeError] = useState<string | null>(null);

  const handleActivateClick = (id: PowerUpId) => {
    if (isLoading) return;

    if (id === 'change_number') {
      setSelectedPowerUp('change_number');
      setNewSecretInput('');
      setChangeError(null);
      return;
    }

    onUsePowerUp(id);
  };

  const handleConfirmChangeNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newSecretInput.trim(), 10);
    if (isNaN(val) || val < 1 || val > 1000) {
      setChangeError('Please enter a valid number between 1 and 1000.');
      return;
    }

    onUsePowerUp('change_number', val);
    setSelectedPowerUp(null);
    setNewSecretInput('');
    setChangeError(null);
  };

  const isShielded = !!myActiveEffects?.isShielded;
  const parityClue = myActiveEffects?.parityClue;
  const isTimeSqueezed = !!myActiveEffects?.isTimeSqueezed;
  const isBlinded = !!myActiveEffects?.isBlinded;

  return (
    <div className="w-full max-w-lg space-y-2">
      {/* Broadcast Log Toast if recent */}
      {recentPowerUpLog && Date.now() - recentPowerUpLog.timestamp < 9000 && (
        <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold text-center shadow-xs animate-scale-in flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{recentPowerUpLog.message}</span>
        </div>
      )}

      {/* Active Effects Status Ribbon */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {isShielded && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-black shadow-2xs animate-pulse">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHIELD ACTIVE (Blocks 1 Attack)</span>
          </div>
        )}

        {parityClue && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-[11px] font-mono font-black shadow-2xs">
            <span>🔍 CLUE: {targetOpponentName}'s secret is {parityClue}!</span>
          </div>
        )}

        {isTimeSqueezed && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono font-black shadow-2xs animate-bounce">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>TIME SQUEEZE: Your turn is 10s!</span>
          </div>
        )}

        {opponentActiveEffects?.isShielded && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-bold">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>{targetOpponentName} has a Shield</span>
          </div>
        )}
      </div>

      {/* Inventory Panel */}
      <div className="bg-white/90 border border-purple-200 rounded-3xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>POWER-UP INVENTORY ({myPowerUps.length}/3)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Tap to activate in duel
          </span>
        </div>

        {myPowerUps.length === 0 ? (
          <div className="py-3 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No power-ups yet. Win them on the Spin Wheel between rounds!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {myPowerUps.map((pId, idx) => {
              const def = POWER_UP_LIST.find((p) => p.id === pId);
              if (!def) return null;

              return (
                <button
                  key={`${pId}-${idx}`}
                  type="button"
                  id={`use-powerup-${pId}-${idx}`}
                  onClick={() => handleActivateClick(pId)}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-center group hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                  style={{
                    backgroundColor: `${def.color}12`,
                    borderColor: `${def.color}66`,
                  }}
                  title={def.description}
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {def.icon}
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800 leading-tight">
                    {def.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 line-clamp-2">
                    {def.description}
                  </span>
                  <div
                    className="mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-black text-white"
                    style={{ backgroundColor: def.color }}
                  >
                    USE NOW
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Secret Shift (Change the Number) */}
      {selectedPowerUp === 'change_number' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-purple-400 text-center animate-scale-in">
            <div className="flex justify-between items-center mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-mono font-black">
                <span>🔄 SECRET SHIFT</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPowerUp(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-mono font-black text-slate-900 mb-1">
              Pick Your New Secret Number
            </h3>
            <p className="text-xs font-mono text-slate-500 mb-4">
              Your opponent will now have to guess this new secret number instead! (1–1000)
            </p>

            {changeError && (
              <p className="text-xs font-mono text-rose-600 mb-3 bg-rose-50 p-2 rounded-xl border border-rose-200">
                {changeError}
              </p>
            )}

            <form onSubmit={handleConfirmChangeNumber} className="space-y-3">
              <input
                type="number"
                min={1}
                max={1000}
                value={newSecretInput}
                onChange={(e) => {
                  setNewSecretInput(e.target.value);
                  setChangeError(null);
                }}
                placeholder="New number (1–1000)"
                autoFocus
                className="w-full py-3 px-4 rounded-2xl bg-purple-50/50 border-2 border-purple-200 focus:border-purple-500 text-center text-2xl font-mono font-black text-purple-900 outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPowerUp(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSecretInput.trim() || isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold cursor-pointer transition shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  Confirm Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
