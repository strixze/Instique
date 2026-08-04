import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_ENV === "production" ? import.meta.env.VITE_BACKEND_URL_PROD : import.meta.env.VITE_BACKEND_URL;

export const socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: false
})


