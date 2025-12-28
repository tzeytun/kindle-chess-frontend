import { elements } from './dom';
import type { GameState } from './types';

function generateSimpleId() {
    return 'player-' + Math.random().toString(36).substring(2, 9);
}

// 1. ID Yönetimi (Hata korumalı)
let myPlayerId = '';

try {
    myPlayerId = localStorage.getItem('kindle_chess_player_id') || '';
} catch (e) {
    console.error("LocalStorage hatası:", e);
}

if (!myPlayerId) {
    myPlayerId = generateSimpleId();
    try {
        localStorage.setItem('kindle_chess_player_id', myPlayerId);
    } catch (e) {
        // Kindle'da gizli moddaysa veya izin yoksa kaydetmeyebilir, sorun yok.
    }
}

// HTML'e yazdırma (Null check ekledik)
if (elements.playerIdDisplay) {
    elements.playerIdDisplay.innerText = myPlayerId;
}

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

// State güncelleme yardımcısı
export function updateState(updates: Partial<GameState>) {
  Object.assign(state, updates);
}