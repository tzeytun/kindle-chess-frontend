import './style.css'
import { io, Socket } from 'socket.io-client';

// 1. DOM Elementleri
const boardEl = document.getElementById('board') as HTMLDivElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const playerIdEl = document.getElementById('playerId') as HTMLSpanElement;

// 2. Oyun Durumu (State)
let socket: Socket;
let myGameId: string | null = null;
let myColor: 'w' | 'b' | null = null;
let currentFen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let selectedSquare: { r: number, c: number } | null = null;
let isMyTurn = false;

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'] 
});

socket.on('connect', () => {
  statusEl.innerText = "Sunucuya bağlanıldı. Rakip aranıyor...";
  playerIdEl.innerText = socket.id || '...';
});

socket.on('status', (msg: string) => {
  statusEl.innerText = msg;
});

// Oyun Başladı Eventi
socket.on('gameStart', (data: { gameId: string, color: 'w' | 'b', fen: string }) => {
  myGameId = data.gameId;
  myColor = data.color;
  currentFen = data.fen;
  
  const colorName = myColor === 'w' ? 'BEYAZ' : 'SİYAH';
  statusEl.innerText = `Oyun Başladı! Sen: ${colorName}`;
  
  // Sıra beyazda başlar
  isMyTurn = myColor === 'w';
  
  renderBoard();
});

// Tahta Güncellemesi (Hamle yapıldığında)
socket.on('updateBoard', (data: any) => {
  currentFen = data.fen;
  const turn = currentFen.split(' ')[1];
  isMyTurn = turn === myColor;


  if (data.isGameOver) {
      let resultText = "OYUN BİTTİ!";
      
      if (data.winner) {
          const winnerName = data.winner === 'w' ? 'BEYAZ' : 'SİYAH';
          resultText = `ŞAH MAT! ${winnerName} KAZANDI 🏆`;
      } else {
          resultText = "OYUN BİTTİ! BERABERE 🤝";
      }
      
      statusEl.innerText = resultText;
      statusEl.className = "text-lg mb-4 font-bold border-2 border-black p-2 w-11/12 text-center bg-black text-white"; // Dikkat çeksin diye siyah yapalım
      
      isMyTurn = false;
  } 
  else {
      
      statusEl.innerText = isMyTurn ? "Sıra SENDE" : "Rakip düşünüyor...";
      statusEl.className = "text-lg mb-4 font-mono border-2 border-black p-2 w-11/12 text-center"; // Eski stile dön
  }
 
  
  selectedSquare = null;
  renderBoard();
});

socket.on('error', (msg: string) => {
  alert(msg); 
 
  selectedSquare = null;
  renderBoard();
});



const PIECES: Record<string, string> = {
  // Siyah Taşlar (d = dark)
  p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',

  // Beyaz Taşlar (l = light)
  P: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  R: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  N: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  B: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  Q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  K: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

// FEN stringini 8x8 matrise çeviren yardımcı fonksiyon
function parseFen(fen: string): string[][] {
  const rows = fen.split(' ')[0].split('/');
  const board: string[][] = [];
  
  for (let row of rows) {
    const rowArr: string[] = [];
    for (let char of row) {
      if (isNaN(Number(char))) {
        rowArr.push(char);
      } else {
        // Sayı varsa o kadar boş kare ekle
        const empties = Number(char);
        for (let i = 0; i < empties; i++) rowArr.push('');
      }
    }
    board.push(rowArr);
  }
  return board;
}

const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function toChessNotation(r: number, c: number): string {
  // Matris: 0. satır tahtanın en üstü (Rank 8), 7. satır en altı (Rank 1)
  const rank = 8 - r;
  return `${cols[c]}${rank}`;
}

function renderBoard() {
  boardEl.innerHTML = '';
  const boardMatrix = parseFen(currentFen);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      const pieceKey = boardMatrix[r][c];
      const isBlackSquare = (r + c) % 2 === 1;
      
      let classes = `relative flex justify-center items-center w-full h-full cursor-pointer border-4 box-border `;
      
      if (isBlackSquare) classes += 'bg-gray-400 '; 
      else classes += 'bg-white ';

      // Seçim Mantığı
      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
        classes += 'border-black '; 
      } else {
        classes += 'border-transparent ';
      }

      square.className = classes;

      // Taş Resmi
      if (pieceKey && PIECES[pieceKey]) {
        const img = document.createElement('img');
        img.src = PIECES[pieceKey];
        img.className = 'w-[80%] h-[80%] object-contain select-none pointer-events-none'; 
        square.appendChild(img);
      }
      
      square.onclick = () => handleSquareClick(r, c, pieceKey);
      boardEl.appendChild(square);
    }
  }
}

function handleSquareClick(r: number, c: number, piece: string) {
  if (!myGameId || !myColor) return;


  if (!selectedSquare) {
    if (!piece) return;
    
    const isPieceWhite = piece === piece.toUpperCase();
    const isMyPiece = (myColor === 'w' && isPieceWhite) || (myColor === 'b' && !isPieceWhite);

    if (isMyPiece) {
        selectedSquare = { r, c };
        renderBoard();
    }
    return;
  }

  if (selectedSquare.r === r && selectedSquare.c === c) {
    selectedSquare = null;
    renderBoard();
    return;
  }

  const from = toChessNotation(selectedSquare.r, selectedSquare.c);
  const to = toChessNotation(r, c);

  console.log(`Hamle gönderiliyor: ${from} -> ${to}`);
  
  socket.emit('makeMove', {
    gameId: myGameId,
    from: from,
    to: to
  });

  selectedSquare = null;
  renderBoard();
}