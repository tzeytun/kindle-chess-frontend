import type { GameState } from './types';

// BASİT ID ÜRETİCİ
function generateSimpleId() {
    return 'player-' + Math.random().toString(36).substring(2, 9);
}

// 1. ID Yönetimi
let myPlayerId = '';

try {
    myPlayerId = localStorage.getItem('kindle_chess_player_id') || '';
} catch (e) { console.error(e); }

if (!myPlayerId) {
    myPlayerId = generateSimpleId();
    try {
        localStorage.setItem('kindle_chess_player_id', myPlayerId);
    } catch (e) {}
}

// Dışarıya sadece ID'yi veriyoruz, ekrana yazdırma işini main.ts yapacak
export const getPlayerId = () => myPlayerId;

// 2. Oyun State'i
export const state: GameState = {
  gameId: null,
  color: null,
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  isMyTurn: false,
  selectedSquare: null,
  lastMove: null
};

export function updateState(updates: Partial<GameState>) {
  Object.assign(state, updates);
}