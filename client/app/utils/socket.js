'use client';

import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';

export function obterSocket() {
    return io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
}
