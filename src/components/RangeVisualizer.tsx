import React from 'react';
import { ArrowLeftRight, HelpCircle } from 'lucide-react';

interface RangeVisualizerProps {
  possibleMin: number;
  possibleMax: number;
  lastGuess?: number | null;
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  possibleMin,
  possibleMax,
  lastGuess,
}) => {
  // Range is 1 to 1000
  const minPercent = ((possibleMin - 1) / 999) * 100;
  const maxPercent = ((possibleMax - 1) / 999) * 100;
  const widthPercent = Math.max(1, maxPercent - minPercent);
  const totalRemainingNumbers = Math.max(1, possibleMax - possibleMin + 1);

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 border border-purple-100 rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
        <div className="flex items-center gap-1.5 font-bold">
          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
          <span className="uppercase tracking-wider">Possible Range</span>
        </div>
        <span className="text-purple-600 font-mono text-[11px] font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          {totalRemainingNumbers} {totalRemainingNumbers === 1 ? 'number left' : 'numbers left'}
        </span>
      </div>

      {/* Prominent Range Badges */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/50 border border-sky-200 text-center shadow-xs">
          <span className="text-[10px] uppercase font-mono text-sky-600 font-bold block">Min</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-sky-700">
            {possibleMin}
          </span>
        </div>

        <span className="text-purple-300 font-bold font-mono text-xl">—</span>

        <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-b from-pink-50 to-pink-100/50 border border-pink-200 text-center shadow-xs">
          <span className="text-[10px] uppercase font-mono text-pink-600 font-bold block">Max</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-pink-700">
            {possibleMax}
          </span>
        </div>
      </div>

      {/* Visual Track (1 to 1000) */}
      <div className="relative mt-3 h-3.5 bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner">
        {/* Active Range Highlight */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 rounded-full opacity-90 transition-all duration-300 shadow-xs"
          style={{
            left: `${minPercent}%`,
            width: `${widthPercent}%`,
          }}
        />

        {/* Marker for last guess if provided */}
        {lastGuess !== undefined && lastGuess !== null && (
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-amber-500 shadow-xs z-10 transition-all duration-300 rounded-full"
            style={{
              left: `${((lastGuess - 1) / 999) * 100}%`,
            }}
            title={`Last Guess: ${lastGuess}`}
          />
        )}
      </div>

      {/* Track Footers (1 and 1000) */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-semibold mt-1.5 px-0.5">
        <span>1</span>
        <span>500</span>
        <span>1000</span>
      </div>
    </div>
  );
};
