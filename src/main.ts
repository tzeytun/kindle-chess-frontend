import './style.css';
import { socket } from './socket';
import { elements } from './dom';
import { state, updateState } from './state';
import { renderBoard } from './board';
import type { SocketData } from './types';

let timerInterval: any = null;
let whiteTimeRemaining = 0;
let blackTimeRemaining = 0;

// --- BOT FONKSİYONU ---
(window as any).playVsBot = (difficulty: string) => {
    socket.emit('playVsBot', { difficulty });
    elements.lobbyStatus.innerText = `${difficulty.toUpperCase()} bot hazırlanıyor...`;
};

// --- EVENT HANDLERS ---

socket.on('connect', () => {
    console.log('Sunucuya bağlandı');
});

socket.on('status', (msg: string) => {
    elements.lobbyStatus.innerText = msg;
    elements.status.innerText = msg;
});

socket.on('error', (msg: string) => {
    alert(msg);
});

socket.on('gameStart', (data: SocketData) => {
    handleGameStart(data);
});

socket.on('reconnectGame', (data: SocketData) => {
    elements.status.innerText = "Tekrar Bağlanıldı!";
    handleGameStart(data);
});

socket.on('roomCreated', (roomId: string) => {
    elements.roomInput.value = roomId;
    elements.lobbyStatus.innerText = `ODA KODU: ${roomId}. Bekleniyor...`;
});


socket.on('returnedToMenu', () => {
    location.reload();
});

socket.on('updateBoard', (data: any) => {
    
    updateState({
        fen: data.fen,
        lastMove: data.lastMove
    });

    const turn = data.fen.split(' ')[1];
    const isMyTurn = turn === state.color;
    updateState({ isMyTurn });

    
    if (data.whiteTime !== undefined) whiteTimeRemaining = Math.floor(data.whiteTime);
    if (data.blackTime !== undefined) blackTimeRemaining = Math.floor(data.blackTime);
    updateTimersDisplay();

    // OYUN BİTİŞ KONTROLÜ
    if (data.isGameOver) {
        if (timerInterval) clearInterval(timerInterval);

        const imWinner = data.winner === state.color;
        let mainText = "";
        let subText = "";

        if (imWinner) {
            mainText = "🏆 KAZANDINIZ! 🏆";
        } else {
            mainText = "😔 KAYBETTİNİZ...";
        }

        if (data.reason === 'resign') subText = imWinner ? "(Rakip terk etti)" : "(Terk ettiniz)";
        else if (data.reason === 'timeout') subText = "(Süre bitti)";
        else if (data.reason === 'checkmate') subText = "(Şah Mat)";
        else subText = "(Oyun Bitti)";

        elements.status.innerHTML = `${mainText}<br><span class="text-sm font-normal">${subText}</span>`;
        elements.status.className = "text-lg mb-2 font-bold bg-black text-white p-2 text-center border-2 border-black";
        
        updateState({ isMyTurn: false });

        
        const exitBtn = document.querySelector('button[onclick="leaveGame()"]') as HTMLButtonElement;
        if(exitBtn) {
            exitBtn.innerText = "Menüye Dön 🏠";
            
            exitBtn.onclick = () => { 
                socket.emit('backToMenu'); 
                
            };
        }
        
    } else {
        // Oyun devam ediyorsa
        elements.status.innerText = isMyTurn ? "Sıra SENDE" : "Rakip düşünüyor...";
        elements.status.className = "text-lg mb-2 font-mono border-2 border-black p-2 text-center";
    }

    updateState({ selectedSquare: null });
    renderBoard();
});

// --- YARDIMCI FONKSİYONLAR ---

function handleGameStart(data: SocketData) {
    updateState({
        gameId: data.gameId,
        color: data.color,
        fen: data.fen,
        lastMove: data.lastMove || null,
        isMyTurn: data.color === 'w'
    });

    if (data.whiteTime !== undefined) whiteTimeRemaining = Math.floor(data.whiteTime);
    if (data.blackTime !== undefined) blackTimeRemaining = Math.floor(data.blackTime);
    
    // Ekran Geçişleri
    elements.lobbyScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.gameScreen.classList.add('flex');

    elements.status.innerText = state.isMyTurn ? "Oyun Başladı! Sıra Sende" : "Oyun Başladı! Rakip Bekleniyor";
    
    updateTimersDisplay();
    startLocalTimer(); 
    renderBoard();
}

function startLocalTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const currentTurn = state.fen.split(' ')[1]; 
        
        
        if (elements.status.innerText.includes('KAZAN') || elements.status.innerText.includes('KAYBET')) { 
            clearInterval(timerInterval);
            return;
        }

        if (currentTurn === 'w') {
            whiteTimeRemaining--;
            if (whiteTimeRemaining < 0) whiteTimeRemaining = 0;
        } else {
            blackTimeRemaining--;
            if (blackTimeRemaining < 0) blackTimeRemaining = 0;
        }
        
        updateTimersDisplay();
    }, 1000);
}

function updateTimersDisplay() {
    elements.whiteTimer.innerText = formatTime(whiteTimeRemaining);
    elements.blackTimer.innerText = formatTime(blackTimeRemaining);

    const currentTurn = state.fen.split(' ')[1]; 

    
    if (currentTurn === 'w') {
        elements.whiteTimer.className = "border-2 border-black px-4 py-1 font-mono text-2xl font-bold bg-black text-white shadow-lg";
        if (elements.whiteIndicator) elements.whiteIndicator.classList.remove('invisible');
        
        elements.blackTimer.className = "border-2 border-black px-4 py-1 font-mono text-2xl font-bold bg-white text-black opacity-60";
        if (elements.blackIndicator) elements.blackIndicator.classList.add('invisible');
    } else {
        elements.whiteTimer.className = "border-2 border-black px-4 py-1 font-mono text-2xl font-bold bg-white text-black opacity-60";
        if (elements.whiteIndicator) elements.whiteIndicator.classList.add('invisible');

        elements.blackTimer.className = "border-2 border-black px-4 py-1 font-mono text-2xl font-bold bg-black text-white shadow-lg";
        if (elements.blackIndicator) elements.blackIndicator.classList.remove('invisible');
    }
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Window Atamaları
(window as any).joinQueue = (time: string) => {
    socket.emit('joinQueue', { time });
    elements.lobbyStatus.innerText = `${time} dk kuyruğuna girildi...`;
};

(window as any).createRoom = () => {
    socket.emit('createRoom');
};

(window as any).joinRoom = () => {
    const code = elements.roomInput.value.trim().toUpperCase();
    if (!code) return alert("Kod girin");
    socket.emit('joinRoom', { roomId: code });
};

(window as any).leaveGame = () => {
    if (confirm("Oyunu terk edip kaybetmeyi kabul ediyor musun?")) {
        socket.emit('resign');
        
    }
};

if (elements.refreshBtn) {
    elements.refreshBtn.onclick = () => {
        document.body.style.filter = "invert(1)";
        setTimeout(() => { document.body.style.filter = "invert(0)"; }, 300);
    };
}