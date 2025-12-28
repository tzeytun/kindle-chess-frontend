export interface GameState {
  gameId: string | null;
  color: 'w' | 'b' | null;
  fen: string;
  isMyTurn: boolean;
  selectedSquare: { r: number, c: number } | null;
  lastMove: { from: string, to: string } | null;
}

export interface SocketData {
  gameId: string;
  color: 'w' | 'b';
  fen: string;
  isGameOver?: boolean;
  winner?: string;
  lastMove?: { from: string, to: string };
  whiteTime?: number;
  blackTime?: number;
}