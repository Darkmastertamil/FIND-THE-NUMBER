import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export const SESSION_KEYS = {
  PLAYER_ID: 'ftn_player_id',
  PLAYER_NAME: 'ftn_player_name',
  ROOM_CODE: 'ftn_room_code',
};

export function getStoredPlayerInfo(): { playerId: string | null; playerName: string; roomCode: string | null } {
  if (typeof window === 'undefined') {
    return { playerId: null, playerName: '', roomCode: null };
  }
  return {
    playerId: sessionStorage.getItem(SESSION_KEYS.PLAYER_ID),
    playerName: sessionStorage.getItem(SESSION_KEYS.PLAYER_NAME) || '',
    roomCode: sessionStorage.getItem(SESSION_KEYS.ROOM_CODE),
  };
}

export function saveStoredPlayerInfo(playerId: string, playerName: string, roomCode?: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEYS.PLAYER_ID, playerId);
  sessionStorage.setItem(SESSION_KEYS.PLAYER_NAME, playerName);
  if (roomCode) {
    sessionStorage.setItem(SESSION_KEYS.ROOM_CODE, roomCode);
  }
}

export function clearStoredRoom() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEYS.ROOM_CODE);
}
