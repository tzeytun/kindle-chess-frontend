import { io } from 'socket.io-client';
import { getPlayerId } from './state';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(SERVER_URL, {
    query: { playerId: getPlayerId() }
});