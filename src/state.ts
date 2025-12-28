import { v4 as uuidv4 } from 'uuid';
import { elements } from './dom';
import type { GameState } from './types';

// 1. ID Yönetimi
let myPlayerId = localStorage.getItem('kindle_chess_player_id');
if (!myPlayerId) {
    myPlayerId = uuidv4();
    localStorage.setItem('kindle_chess_player_id', myPlayerId);
}
elements.playerIdDisplay.innerText = myPlayerId.substring(0, 8);

export const getPlayerId = () => myPlayerId as string;

// 2. Oyun State'i (Başlangıç Değerleri)
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