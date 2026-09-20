import React from 'react';
import { ClientRoomState } from '../types';
import { SpinWheel } from '../components/SpinWheel';
import { Lock, Eye } from 'lucide-react';

interface WheelScreenProps {
  room: ClientRoomState;
  currentUserId: string;
}

export const WheelScreen: React.FC<WheelScreenProps> = ({ room, currentUserId }) => {
  const isSetter = room.setterId === currentUserId;
  const isSelected = room.wheelData?.selectedPlayerId === currentUserId;

  if (!room.wheelData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center font-mono text-purple-600 font-bold animate-pulse">
          🎡 Preparing Wheel Selection...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full my-auto">
      {/* Notice if user is the Number Setter */}
      {isSetter && (
        <div className="mb-4 w-full max-w-md p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono flex items-center justify-center gap-2 shadow-xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are the Number Setter. Your locked secret is{' '}
            <strong className="text-amber-950 font-black bg-amber-150 px-1.5 py-0.5 rounded-md border border-amber-200">{room.myLockedSecret}</strong>. You are excluded from guessing.
          </span>
        </div>
      )}

      {/* Main Wheel Component */}
      <SpinWheel
        wheelData={room.wheelData}
        isCurrentUserSelected={isSelected}
      />
    </div>
  );
};
