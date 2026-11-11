'use client';

const BACKEND_URL = 'http://localhost:5000';

export function obterSocket() {
    if (typeof window !== 'undefined' && window.io) {
        return window.io(BACKEND_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    }

    try {

        const socketIo = require('socket.io-client');
        const ioFunc = socketIo.io || socketIo.default || socketIo;
        return ioFunc(BACKEND_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    } catch (e) {
        if (typeof window !== 'undefined' && window.io) {
            return window.io(BACKEND_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });
        }
        throw new Error('Socket.io client indisponível.');
    }
}
