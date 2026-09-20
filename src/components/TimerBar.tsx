import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TimerBarProps {
  expiresAt: number | null;
  durationMs: number;
  isCurrentUser: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  expiresAt,
  durationMs = 15000,
  isCurrentUser,
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  const lastSecondRef = useRef<number>(-1);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(durationMs);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, expiresAt - now);
      setRemainingMs(left);

      const secondsLeft = Math.ceil(left / 1000);
      // Play urgent sound during final 4 seconds if it's the active user
      if (secondsLeft <= 4 && secondsLeft > 0 && secondsLeft !== lastSecondRef.current) {
        lastSecondRef.current = secondsLeft;
        if (isCurrentUser) {
          soundManager.playUrgentTick();
        }
      }

      if (left <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt, durationMs, isCurrentUser]);

  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / durationMs) * 100));

  // Color transitions based on remaining time in pastel styling
  const getColor = () => {
    if (secondsLeft <= 4) return { bar: 'bg-rose-400 shadow-xs', text: 'text-rose-600' };
    if (secondsLeft <= 8) return { bar: 'bg-amber-400 shadow-xs', text: 'text-amber-700' };
    return { bar: 'bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 shadow-xs', text: 'text-purple-700' };
  };

  const colors = getColor();

  return (
    <div className="w-full max-w-md mx-auto my-2">
      <div className="flex items-center justify-between text-xs font-mono mb-1.5 px-1">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className={`w-3.5 h-3.5 ${secondsLeft <= 4 ? 'animate-pulse text-rose-500' : 'text-slate-400'}`} />
          <span className="font-semibold">Turn Timer</span>
        </div>
        <div className={`font-bold text-sm tracking-wider ${colors.text}`}>
          ⏱️ {secondsLeft}s
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 bg-purple-50 rounded-full border border-purple-200 overflow-hidden p-0.5 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${colors.bar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
