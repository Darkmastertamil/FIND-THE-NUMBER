import React, { useEffect, useRef, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { WheelData } from '../types';
import { soundManager } from '../utils/audio';

interface SpinWheelProps {
  wheelData: WheelData;
  onSpinComplete?: () => void;
  isCurrentUserSelected?: boolean;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  wheelData,
  onSpinComplete,
  isCurrentUserSelected = false,
}) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const { eligiblePlayers, selectedPlayerId, selectedPlayerName, spinTargetDegrees, spinDurationMs } = wheelData;
  const N = Math.max(1, eligiblePlayers.length);
  const segmentAngle = 360 / N;

  // Wheel dimensions
  const size = 360;
  const center = size / 2;
  const radius = center - 16;

  useEffect(() => {
    setIsSpinning(true);
    setIsCompleted(false);

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const actualDuration = prefersReducedMotion ? Math.min(1000, spinDurationMs) : spinDurationMs;

    // Trigger spin animation
    const timer = setTimeout(() => {
      setCurrentRotation(spinTargetDegrees);
    }, 50);

    // Audio ticking effect based on simulated rotation progression
    let startTime: number | null = null;
    let lastTickAngle = 0;

    const tickInterval = () => {
      const now = performance.now();
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / actualDuration);

      // Smooth ease-out curve matching CSS cubic-bezier
      const easeOut = 1 - Math.pow(1 - progress, 3.2);
      const simulatedAngle = easeOut * spinTargetDegrees;

      if (simulatedAngle - lastTickAngle >= segmentAngle * 0.75 && progress < 0.96) {
        soundManager.playTick();
        lastTickAngle = simulatedAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tickInterval);
      }
    };

    animFrameRef.current = requestAnimationFrame(tickInterval);

    // Handle spin completion
    const completeTimer = setTimeout(() => {
      setIsSpinning(false);
      setIsCompleted(true);
      soundManager.playWheelStop();
      if (onSpinComplete) {
        onSpinComplete();
      }
    }, actualDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [wheelData, spinTargetDegrees, spinDurationMs, segmentAngle, onSpinComplete]);

  // Convert polar coordinates to Cartesian for SVG path
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    // 0 deg is at the top (12 o'clock)
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

    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ');
  };

  // Color palette for pastel segments with high-contrast text
  const SEGMENT_COLORS = [
    { fill: '#bae6fd', stroke: '#38bdf8', text: '#0369a1' }, // Pastel Sky Blue
    { fill: '#e9d5ff', stroke: '#c084fc', text: '#581c87' }, // Pastel Lavender
    { fill: '#fbcfe8', stroke: '#f472b6', text: '#831843' }, // Pastel Blossom Pink
    { fill: '#a7f3d0', stroke: '#34d399', text: '#064e3b' }, // Pastel Mint Green
    { fill: '#fed7aa', stroke: '#fb923c', text: '#7c2d12' }, // Pastel Soft Peach
    { fill: '#fef08a', stroke: '#facc15', text: '#713f12' }, // Pastel Butter Yellow
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      {/* Status banner */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-200 shadow-xs">
          <Sparkles className={`w-4 h-4 ${isSpinning ? 'text-purple-500 animate-spin' : 'text-purple-600'}`} />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-purple-800">
            {isCompleted ? '🎯 First Guesser Selected!' : isSpinning ? '🎡 Choosing Who Starts First...' : 'Wheel Ready'}
          </span>
        </div>
      </div>

      {/* Wheel Wrapper with Outer Bezel */}
      <div className="relative flex items-center justify-center p-3 rounded-full bg-white border-6 border-amber-100 shadow-xl">
        {/* Top Pointer */}
        <div className="absolute -top-3.5 z-30 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 filter drop-shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs -mt-1" />
        </div>

        {/* Rotating SVG Wheel */}
        <div className="relative overflow-hidden rounded-full">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] select-none"
            style={{
              transform: `rotate(${currentRotation}deg)`,
              transition: isSpinning
                ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.8, 0.22, 1)`
                : 'none',
              transformOrigin: 'center center',
            }}
          >
            {/* Outer Rim */}
            <circle
              cx={center}
              cy={center}
              r={radius + 8}
              fill="none"
              stroke="#f8fafc"
              strokeWidth="12"
            />

            {/* Segments */}
            {eligiblePlayers.map((player, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;
              const midAngle = startAngle + segmentAngle / 2;
              const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
              const isChosen = isCompleted && player.id === selectedPlayerId;

              // Text position along radius
              const textPos = polarToCartesian(center, center, radius * 0.62, midAngle);

              return (
                <g key={player.id} className="transition-all duration-300">
                  {/* Segment slice */}
                  {N === 1 ? (
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill={color.fill}
                      stroke={color.stroke}
                      strokeWidth="3"
                    />
                  ) : (
                    <path
                      d={describeArc(center, center, radius, startAngle, endAngle)}
                      fill={color.fill}
                      stroke={isChosen ? '#f59e0b' : color.stroke}
                      strokeWidth={isChosen ? '5' : '2'}
                      className={isChosen ? 'filter drop-shadow-md' : ''}
                    />
                  )}

                  {/* Player Label inside Segment */}
                  <g
                    transform={`translate(${textPos.x}, ${textPos.y}) rotate(${
                      midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle
                    })`}
                  >
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={color.text}
                      fontSize={N > 3 ? '13' : '15'}
                      fontWeight="900"
                      fontFamily="monospace"
                      letterSpacing="0.05em"
                    >
                      {player.name.toUpperCase()}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Glowing Segment Dividers (Pins on outer rim) */}
            {eligiblePlayers.map((_, index) => {
              const pinPos = polarToCartesian(center, center, radius + 2, index * segmentAngle);
              return (
                <circle
                  key={`pin-${index}`}
                  cx={pinPos.x}
                  cy={pinPos.y}
                  r="4"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}

            {/* Center Decorative Hub */}
            <circle
              cx={center}
              cy={center}
              r="34"
              fill="#ffffff"
              stroke="#a855f7"
              strokeWidth="4"
              className="filter drop-shadow-sm"
            />
            <circle
              cx={center}
              cy={center}
              r="22"
              fill="#faf5ff"
              stroke="#9333ea"
              strokeWidth="2"
            />
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="16"
            >
              🎯
            </text>
          </svg>
        </div>
      </div>

      {/* Winner Announcement below Wheel */}
      <div className="mt-6 text-center min-h-[4.5rem] flex flex-col items-center justify-center">
        {isCompleted ? (
          <div className="animate-scale-in">
            <p className="text-xs font-mono uppercase tracking-widest text-purple-700 font-bold">
              Starts Guessing First
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Sparkles className="w-4 h-4 text-purple-500 animate-bounce" />
              <h3 className="text-xl sm:text-2xl font-black font-mono text-purple-900 tracking-wider">
                {selectedPlayerName}
              </h3>
              <Sparkles className="w-4 h-4 text-purple-500 animate-bounce" />
            </div>
            {isCurrentUserSelected ? (
              <p className="text-xs font-mono font-bold text-purple-700 mt-1 animate-pulse">
                ⚡ YOU START GUESSING FIRST! Both players will now choose secret numbers...
              </p>
            ) : (
              <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                {selectedPlayerName} will take the first guess! Both players will now choose secret numbers...
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            <span>Spinning wheel (5 seconds) to choose who starts first...</span>
          </div>
        )}
      </div>
    </div>
  );
};
