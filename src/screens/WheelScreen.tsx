import React from 'react';
import { ClientRoomState } from '../types';
import { SpinWheel } from '../components/SpinWheel';
import { Crown } from 'lucide-react';

interface WheelScreenProps {
  room: ClientRoomState;
  currentUserId: string;
}

export const WheelScreen: React.FC<WheelScreenProps> = ({ room, currentUserId }) => {
  const isSelected = room.wheelData?.selectedPlayerId === currentUserId;

  if (!room.wheelData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center font-mono text-amber-600 font-bold animate-pulse">
          🎡 Preparing Wheel Selection...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full my-auto">
      {/* Round Header Banner */}
      <div className="mb-4 w-full max-w-md p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono flex items-center justify-center gap-2 shadow-xs">
        <Crown className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Round <strong>{room.round}</strong> of <strong>{room.maxRounds}</strong>: Spinning wheel to choose the <strong>Number Setter</strong>!
        </span>
      </div>

      {/* Main Wheel Component */}
      <SpinWheel
        wheelData={room.wheelData}
        isCurrentUserSelected={isSelected}
      />
    </div>
  );
};
