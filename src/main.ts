import './style.css';
import { socket } from './socket';
import { elements } from './dom';
import { state, updateState, getPlayerId } from './state';
import { renderBoard } from './board';
import type { SocketData } from './types';

// --- BAŞLANGIÇTA ID YAZDIR (Bilgisayar & Kindle için Garanti Çözüm) ---
// Sayfa yüklendiğinde ID'yi alıp HTML'e basıyoruz.
document.addEventListener('DOMContentLoaded', () => {
    const pid = getPlayerId();
    if (elements.playerIdDisplay) {
        elements.playerIdDisplay.innerText = pid;
    }
});

let timerInterval: any = null;
let whiteTimeRemaining = 0;
let blackTimeRemaining = 0;

let resignConfirmStage = false;
let resignTimeout: any = null;
const resignBtn = document.getElementById('resignBtn') as HTMLButtonElement;

if (resignBtn) {
    resignBtn.onclick = () => {
        // Eğer oyun zaten bittiyse "Menüye Dön" modundadır
        if (resignBtn.innerText.includes('Menü')) {
            socket.emit('backToMenu');
            location.reload();
            return;
        }

        // Oyun devam ediyorsa:
        if (!resignConfirmStage) {
            // 1. TIKLAMA: Onay İste
            resignConfirmStage = true;
            resignBtn.innerText = "Emin misin? (Bas)";
            resignBtn.className = "flex-1 border-2 border-black py-2 font-bold text-sm bg-black text-white"; // Dikkat çeksin diye siyah yap
            
            // 3 saniye içinde basmazsa iptal et
            resignTimeout = setTimeout(() => {
                resignConfirmStage = false;
                resignBtn.innerText = "Çıkış 🏳️";
                resignBtn.className = "flex-1 border-2 border-black py-2 font-bold text-sm hover:bg-black hover:text-white transition-colors";
            }, 3000);

        } else {
            // 2. TIKLAMA: Pes Et
            clearTimeout(resignTimeout);
            socket.emit('resign');
            resignBtn.innerText = "Pes Ediliyor...";
            resignConfirmStage = false;
        }
    };
}

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
        // --- YENİ EKLENEN KISIM: ALERT İLE BİLDİRİM ---
        let alertMsg = "";
        if (imWinner) alertMsg = "KAZANDIN! ";
        else alertMsg = "KAYBETTİN... ";

        if (data.reason === 'resign') alertMsg += "(Rakip Terk Etti)";
        else if (data.reason === 'timeout') alertMsg += "(Süre Bitti)";
        else if (data.reason === 'checkmate') alertMsg += "(Şah Mat)";
        
        // Kindle kullanıcısı bunu kesin görür:
        setTimeout(() => alert(alertMsg), 100); 
        // ----------------------------------------------

        // Statü yazısını güncelle
        elements.status.innerText = alertMsg;
        elements.status.className = "text-xs font-bold bg-black text-white p-1 text-center truncate"; // Daha küçük font
        
        updateState({ isMyTurn: false });

        // Butonu "Menüye Dön" yap
        if(resignBtn) {
            resignBtn.innerText = "Menü 🏠"; // Kısa isim
            resignBtn.className = "border-2 border-black px-3 py-1 font-bold text-xs bg-white text-black";
            // Onclick olayını değiştiriyoruz
             resignBtn.onclick = () => { 
                socket.emit('backToMenu'); 
                location.reload(); 
            };
        }
        
    } else {
        // Oyun devam ediyorsa
        elements.status.innerText = isMyTurn ? "Sıra SENDE" : "Rakip Bekleniyor...";
        elements.status.className = "text-xs font-mono font-bold truncate";
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


if (elements.refreshBtn) {
    elements.refreshBtn.onclick = () => {
        document.body.style.filter = "invert(1)";
        setTimeout(() => { document.body.style.filter = "invert(0)"; }, 300);
    };
}