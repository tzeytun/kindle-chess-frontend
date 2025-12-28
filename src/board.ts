import { elements } from './dom';
import { state, updateState } from './state';
import { parseFen, toChessNotation, PIECES } from './utils';
import { socket } from './socket';

export function renderBoard() {
    elements.board.innerHTML = '';
    const boardMatrix = parseFen(state.fen);
    const amIBlack = state.color === 'b';

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            
            const r = amIBlack ? 7 - i : i;
            const c = amIBlack ? 7 - j : j;
            
            const squareName = toChessNotation(r, c); 
            const pieceKey = boardMatrix[r][c];
            const isBlackSquare = (r + c) % 2 === 1;

            
            let classes = `relative flex justify-center items-center w-full h-full cursor-pointer border-4 box-border `;
            classes += isBlackSquare ? 'bg-gray-400 ' : 'bg-white ';

           
            if (state.lastMove && (state.lastMove.from === squareName || state.lastMove.to === squareName)) {
                classes = classes.replace('bg-gray-400', 'bg-gray-500').replace('bg-white', 'bg-gray-200');
            }

            
            if (state.selectedSquare && state.selectedSquare.r === r && state.selectedSquare.c === c) {
                classes += 'border-black ';
            } else {
                classes += 'border-transparent ';
            }

            
            const square = document.createElement('div');
            square.className = classes;

            if (pieceKey && PIECES[pieceKey]) {
                const img = document.createElement('img');
                img.src = PIECES[pieceKey];
                img.className = 'w-[80%] h-[80%] object-contain select-none pointer-events-none';
                square.appendChild(img);
            }

            square.onclick = () => handleSquareClick(r, c, pieceKey);
            elements.board.appendChild(square);
        }
    }
}

function handleSquareClick(r: number, c: number, piece: string) {
    if (!state.gameId || !state.color) return;

    
    if (!state.selectedSquare) {
        if (!piece) return;
        const isPieceWhite = piece === piece.toUpperCase();
        const isMyPiece = (state.color === 'w' && isPieceWhite) || (state.color === 'b' && !isPieceWhite);

        if (isMyPiece) {
            updateState({ selectedSquare: { r, c } });
            renderBoard();
        }
        return;
    }

    
    if (state.selectedSquare.r === r && state.selectedSquare.c === c) {
        updateState({ selectedSquare: null }); 
        renderBoard();
        return;
    }

    
    const from = toChessNotation(state.selectedSquare.r, state.selectedSquare.c);
    const to = toChessNotation(r, c);

    console.log(`Hamle: ${from} -> ${to}`);
    
    socket.emit('makeMove', {
        gameId: state.gameId,
        move: { from, to } 
    });

    updateState({ selectedSquare: null });
    renderBoard();
}