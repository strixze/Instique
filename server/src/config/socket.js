import { Server } from 'socket.io';
import env from './env.js';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';
import { socketAuth } from '../realtime/socket.auth.js';

let io;

export const initializeSocket = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Attach authentication middleware
  io.use(socketAuth);

  // Setup Redis adapter if REDIS_URL provided
  if (env.REDIS_URL) {
    const pubClient = new IORedis(env.REDIS_URL);
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.io Redis adapter initialized');
  } else {
    console.warn('REDIS_URL not set; using in‑memory adapter for Socket.io');
  }

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    // rooms will be joined in auth middleware after verification
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
