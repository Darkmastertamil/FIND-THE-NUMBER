import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Gift, ArrowRight, Shield, RefreshCw, EyeOff, Scissors, Clock, HelpCircle } from 'lucide-react';
import { PowerUpWheelData, ClientRoomState } from '../types';
import { soundManager } from '../utils/audio';

interface PowerUpWheelProps {
  wheelData: PowerUpWheelData;
  room: ClientRoomState;
  currentUserId: string;
  onNextRound: () => void;
  isLoading: boolean;
}

export const PowerUpWheel: React.FC<PowerUpWheelProps> = ({
  wheelData,
  room,
  currentUserId,
  onNextRound,
  isLoading,
}) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const {
    items,
    awardedPlayerId,
    awardedPlayerName,
    powerUpName,
    powerUpDescription,
    spinTargetDegrees,
    spinDurationMs,
  } = wheelData;

  const isMeAwarded = awardedPlayerId === currentUserId;
  const isHost = room.hostId === currentUserId;
  const N = Math.max(1, items.length);
  const segmentAngle = 360 / N;

  const size = 360;
  const center = size / 2;
  const radius = center - 16;

  useEffect(() => {
    setIsSpinning(true);
    setIsCompleted(false);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const actualDuration = prefersReducedMotion ? Math.min(1000, spinDurationMs) : spinDurationMs;

    const timer = setTimeout(() => {
      setCurrentRotation(spinTargetDegrees);
    }, 50);

    let startTime: number | null = null;
    let lastTickAngle = 0;

    const tickInterval = () => {
      const now = performance.now();
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / actualDuration);

      const easeOut = 1 - Math.pow(1 - progress, 3.2);
      const simulatedAngle = easeOut * spinTargetDegrees;

      if (simulatedAngle - lastTickAngle >= segmentAngle * 0.8 && progress < 0.95) {
        soundManager.playTick();
        lastTickAngle = simulatedAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tickInterval);
      }
    };

    animFrameRef.current = requestAnimationFrame(tickInterval);

    const completeTimer = setTimeout(() => {
      setIsSpinning(false);
      setIsCompleted(true);
      soundManager.playWheelStop();
    }, actualDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [spinTargetDegrees, spinDurationMs, segmentAngle]);

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${x} ${y} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 max-w-lg mx-auto w-full my-auto">
      <div className="w-full bg-white/95 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-100/50 text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs font-black tracking-widest uppercase mb-2 shadow-xs">
          <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
          <span>RANDOM POWER-UP WHEEL</span>
        </div>

        {/* Lucky Player Announcement */}
        <div className="mb-3">
          <p className="text-xs font-mono text-slate-500 font-medium">
            Lucky player selected for this round:
          </p>
          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200">
            <span className="font-mono font-black text-purple-900 text-sm sm:text-base">
              {isMeAwarded ? '🎉 YOU!' : `👤 ${awardedPlayerName}`}
            </span>
          </div>
        </div>

        {/* The Animated Wheel */}
        <div className="relative flex items-center justify-center my-2 select-none">
          {/* Wheel Pointer at Top (12 o'clock) */}
          <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-md">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-rose-500" />
            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 -mt-5 border-2 border-white" />
          </div>

          {/* SVG Wheel Disc */}
          <div
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full p-2 bg-gradient-to-tr from-amber-400 via-pink-400 to-purple-500 shadow-xl"
            style={{
              boxShadow: isCompleted
                ? '0 0 35px rgba(245, 158, 11, 0.45)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-900">
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-full h-full"
                style={{
                  transform: `rotate(${currentRotation}deg)`,
                  transition: isSpinning
                    ? `transform ${spinDurationMs}ms cubic-bezier(0.15, 0.9, 0.25, 1)`
                    : 'none',
                }}
              >
                <circle cx={center} cy={center} r={radius + 4} fill="#1e293b" />

                {items.map((item, index) => {
                  const startAngle = index * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const pathData = describeArc(center, center, radius, startAngle, endAngle);

                  const midAngle = startAngle + segmentAngle / 2;
                  const textPos = polarToCartesian(center, center, radius * 0.65, midAngle);
                  const iconPos = polarToCartesian(center, center, radius * 0.85, midAngle);

                  return (
                    <g key={item.id}>
                      <path
                        d={pathData}
                        fill={item.color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        opacity={isCompleted && item.id !== wheelData.powerUpId ? 0.45 : 1}
                        className="transition-opacity duration-500"
                      />
                      {/* Icon text */}
                      <text
                        x={iconPos.x}
                        y={iconPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="20"
                        transform={`rotate(${midAngle}, ${iconPos.x}, ${iconPos.y})`}
                      >
                        {item.icon}
                      </text>
                      {/* Label text */}
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="monospace"
                        transform={`rotate(${midAngle + 90}, ${textPos.x}, ${textPos.y})`}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                      >
                        {item.name}
                      </text>
                    </g>
                  );
                })}

                {/* Center Hub */}
                <circle cx={center} cy={center} r={28} fill="#ffffff" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx={center} cy={center} r={18} fill="#f59e0b" />
              </svg>
            </div>
          </div>
        </div>

        {/* Outcome Card */}
        {isCompleted ? (
          <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-800 uppercase">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                {isMeAwarded ? 'YOU WON A POWER-UP!' : `${awardedPlayerName} WON A POWER-UP!`}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-amber-950 mt-1 flex items-center justify-center gap-2">
              <span>{wheelData.items.find((i) => i.id === wheelData.powerUpId)?.icon}</span>
              <span>{powerUpName}</span>
            </div>
            <p className="text-xs font-mono text-slate-600 mt-1 font-medium max-w-sm mx-auto">
              {powerUpDescription}
            </p>
            <p className="text-[10px] font-mono text-purple-700 mt-2 font-bold">
              ⚡ Added to inventory for the upcoming guessing duel!
            </p>
          </div>
        ) : (
          <div className="mt-3 py-2 text-xs font-mono text-slate-400 font-semibold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Spinning power-up wheel...</span>
          </div>
        )}

        {/* Action button to proceed */}
        <div className="mt-5">
          {room.round < room.maxRounds ? (
            isHost ? (
              <button
                id="start-next-round-after-powerup-btn"
                onClick={onNextRound}
                disabled={isLoading || !isCompleted}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:opacity-95 text-white font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-purple-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Starting Round...' : `CONTINUE TO ROUND ${room.round + 1}`}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <div className="py-2.5 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                <span>Waiting for host to launch Round {room.round + 1}...</span>
              </div>
            )
          ) : (
            <button
              id="powerup-final-results-btn"
              onClick={onNextRound}
              disabled={isLoading || !isCompleted}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:opacity-95 text-amber-950 font-mono font-black text-sm tracking-wider uppercase transition shadow-md shadow-amber-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>VIEW FINAL RESULTS</span>
              <ArrowRight className="w-4 h-4 text-amber-950" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
