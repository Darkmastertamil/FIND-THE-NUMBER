import React, { useState, useEffect, useCallback } from 'react';
import { ClientRoomState, Player } from './types';
import {
  socket,
  getStoredPlayerInfo,
  saveStoredPlayerInfo,
  clearStoredRoom,
} from './utils/socket';
import { Header } from './components/Header';
import { RulesModal } from './components/RulesModal';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SetterScreen } from './screens/SetterScreen';
import { WheelScreen } from './screens/WheelScreen';
import { GuessingScreen } from './screens/GuessingScreen';
import { RoundResultScreen } from './screens/RoundResultScreen';
import { FinalResultScreen } from './screens/FinalResultScreen';
import { AlertTriangle, WifiOff } from 'lucide-react';

export default function App() {
  const [connected, setConnected] = useState<boolean>(socket.connected);
  const [room, setRoom] = useState<ClientRoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Show temporary toast notification
  const showToast = useCallback((msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, duration);
  }, []);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      // Attempt reconnection to room if session info exists
      const stored = getStoredPlayerInfo();
      if (stored.roomCode && stored.playerId) {
        socket.emit(
          'syncRoom',
          { code: stored.roomCode, playerId: stored.playerId },
          (res: { success: boolean; room?: ClientRoomState; error?: string }) => {
            if (res && res.success && res.room) {
              setRoom(res.room);
              setPlayerId(stored.playerId!);
              setPlayerName(stored.playerName || '');
            } else {
              clearStoredRoom();
            }
          }
        );
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleRoomStateUpdate = (updatedRoom: ClientRoomState) => {
      setRoom(updatedRoom);
      setIsLoading(false);
    };

    const handleTurnTimedOut = (data: { playerName: string; message: string }) => {
      showToast(data.message, 3000);
    };

    const handlePlayerSecretLocked = (data: { playerId: string; playerName: string }) => {
      showToast(`🔒 ${data.playerName} locked their secret number!`, 2000);
    };

    const handleAllSecretsLocked = (data: { message: string }) => {
      showToast(`⚡ ${data.message}`, 2500);
    };

    const handleHostTransferred = (data: { hostId: string; hostName: string }) => {
      showToast(`👑 ${data.hostName} is now the host!`, 3000);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('roomStateUpdate', handleRoomStateUpdate);
    socket.on('turnTimedOut', handleTurnTimedOut);
    socket.on('playerSecretLocked', handlePlayerSecretLocked);
    socket.on('allSecretsLocked', handleAllSecretsLocked);
    socket.on('hostTransferred', handleHostTransferred);

    // Initial state check
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('roomStateUpdate', handleRoomStateUpdate);
      socket.off('turnTimedOut', handleTurnTimedOut);
      socket.off('playerSecretLocked', handlePlayerSecretLocked);
      socket.off('allSecretsLocked', handleAllSecretsLocked);
      socket.off('hostTransferred', handleHostTransferred);
    };
  }, [showToast]);

  // Load stored name on first render
  useEffect(() => {
    const stored = getStoredPlayerInfo();
    if (stored.playerName) {
      setPlayerName(stored.playerName);
    }
    if (stored.playerId) {
      setPlayerId(stored.playerId);
    }
  }, []);

  // Action: Create Room
  const handleCreateRoom = (name: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    socket.emit(
      'createRoom',
      { playerName: name, playerId: playerId || undefined },
      (res: { success: boolean; room?: ClientRoomState; player?: Player; error?: string }) => {
        setIsLoading(false);
        if (res.success && res.room && res.player) {
          setRoom(res.room);
          setPlayerId(res.player.id);
          setPlayerName(res.player.name);
          saveStoredPlayerInfo(res.player.id, res.player.name, res.room.code);
          showToast(`Room created! Share code: ${res.room.code}`);
        } else {
          setErrorMessage(res.error || 'Failed to create room.');
        }
      }
    );
  };

  // Action: Join Room
  const handleJoinRoom = (name: string, code: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    socket.emit(
      'joinRoom',
      { code, playerName: name, playerId: playerId || undefined },
      (res: { success: boolean; room?: ClientRoomState; player?: Player; error?: string }) => {
        setIsLoading(false);
        if (res.success && res.room && res.player) {
          setRoom(res.room);
          setPlayerId(res.player.id);
          setPlayerName(res.player.name);
          saveStoredPlayerInfo(res.player.id, res.player.name, res.room.code);
          showToast(`Joined Room ${res.room.code}!`);
        } else {
          setErrorMessage(res.error || 'Failed to join room.');
        }
      }
    );
  };

  // Action: Start Game (Host only)
  const handleStartGame = () => {
    if (!room) return;
    setIsLoading(true);
    socket.emit('startGame', { code: room.code, playerId }, (res: { success: boolean; error?: string }) => {
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to start game.');
      }
    });
  };

  // Action: Submit Secret (Setter only)
  const handleLockSecret = (secret: number) => {
    if (!room) return;
    setIsLoading(true);
    socket.emit(
      'submitSecret',
      { code: room.code, playerId, secret },
      (res: { success: boolean; error?: string }) => {
        setIsLoading(false);
        if (!res.success) {
          showToast(res.error || 'Failed to lock secret number.');
        }
      }
    );
  };

  // Action: Submit Guess (Guesser only)
  const handleSubmitGuess = (guess: number) => {
    if (!room) return;
    setIsLoading(true);
    setActionError(null);

    socket.emit(
      'submitGuess',
      { code: room.code, playerId, guess },
      (res: { success: boolean; error?: string; result?: string; isCorrect?: boolean }) => {
        setIsLoading(false);
        if (!res.success) {
          setActionError(res.error || 'Failed to submit guess.');
        }
      }
    );
  };

  // Action: Next Round
  const handleNextRound = () => {
    if (!room) return;
    setIsLoading(true);
    socket.emit('nextRound', { code: room.code, playerId }, (res: { success: boolean; error?: string }) => {
      setIsLoading(false);
      if (!res.success) {
        showToast(res.error || 'Failed to proceed to next round.');
      }
    });
  };

  // Action: Rematch
  const handleRematch = () => {
    if (!room) return;
    setIsLoading(true);
    socket.emit('rematch', { code: room.code, playerId }, (res: { success: boolean; error?: string }) => {
      setIsLoading(false);
      if (!res.success) {
        showToast(res.error || 'Failed to restart match.');
      }
    });
  };

  // Action: Leave Room
  const handleLeaveRoom = () => {
    clearStoredRoom();
    setRoom(null);
    setErrorMessage(null);
    setActionError(null);
    // Disconnect and reconnect socket to leave server rooms cleanly
    socket.disconnect();
    socket.connect();
  };

  // Determine which screen to render
  const renderContent = () => {
    if (!room) {
      return (
        <HomeScreen
          initialName={playerName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          onOpenRules={() => setShowRules(true)}
        />
      );
    }

    switch (room.status) {
      case 'lobby':
        return (
          <LobbyScreen
            room={room}
            currentUserId={playerId}
            onStartGame={handleStartGame}
            isLoading={isLoading}
          />
        );
      case 'setter_selection':
        return (
          <SetterScreen
            room={room}
            currentUserId={playerId}
            onLockSecret={handleLockSecret}
            isLoading={isLoading}
          />
        );
      case 'wheel_spinning':
        return <WheelScreen room={room} currentUserId={playerId} />;
      case 'guessing':
        return (
          <GuessingScreen
            room={room}
            currentUserId={playerId}
            onSubmitGuess={handleSubmitGuess}
            isLoading={isLoading}
            actionError={actionError}
            onClearActionError={() => setActionError(null)}
          />
        );
      case 'round_result':
        return (
          <RoundResultScreen
            room={room}
            currentUserId={playerId}
            onNextRound={handleNextRound}
            isLoading={isLoading}
          />
        );
      case 'final_result':
        return (
          <FinalResultScreen
            room={room}
            currentUserId={playerId}
            onRematch={handleRematch}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-4 font-mono text-purple-600 font-bold animate-pulse">
            Connecting to game...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50/70 via-pink-50/50 to-sky-50/70 text-slate-800 selection:bg-purple-200 selection:text-purple-900 overflow-x-hidden">
      {/* App Header */}
      <Header
        roomCode={room?.code}
        round={room?.round}
        maxRounds={room?.maxRounds}
        connected={connected}
        onOpenRules={() => setShowRules(true)}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
      />

      {/* Disconnected Alert Banner */}
      {!connected && (
        <div className="w-full bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-700 text-xs font-mono flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-4 h-4 animate-pulse text-rose-500" />
          <span>Lost connection to game server. Reconnecting automatically...</span>
        </div>
      )}

      {/* Paused Match Alert */}
      {room?.isPaused && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-800 text-xs font-mono flex items-center justify-center gap-2 animate-pulse font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{room.pauseMessage || '⚠️ Waiting for another player to continue the match...'}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-white/95 border border-purple-200 text-purple-900 text-xs font-mono font-bold shadow-lg shadow-purple-100 flex items-center gap-2 animate-scale-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4">
        {renderContent()}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
