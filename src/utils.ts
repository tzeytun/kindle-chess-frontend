export const PIECES: Record<string, string> = {
  r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  R: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  N: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  B: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  Q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  K: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  P: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
};

export const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function toChessNotation(r: number, c: number): string {
  const rank = 8 - r;
  return `${COLS[c]}${rank}`;
}

export function parseFen(fen: string): string[][] {
  const rows = fen.split(' ')[0].split('/');
  const board: string[][] = [];
  for (let row of rows) {
    const rowArr: string[] = [];
    for (let char of row) {
      if (isNaN(Number(char))) {
        rowArr.push(char);
      } else {
        const empties = Number(char);
        for (let i = 0; i < empties; i++) rowArr.push('');
      }
    }
    board.push(rowArr);
  }
  return board;
}