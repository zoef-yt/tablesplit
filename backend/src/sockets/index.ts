import { Server, Socket } from 'socket.io';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const { userId } = authService.verifyToken(token);
      (socket as any).userId = userId;

      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join group room
    socket.on('group:join', (groupId: string) => {
      socket.join(`group:${groupId}`);
      logger.info(`User ${userId} joined group room ${groupId}`);

      // Notify others in the group
      socket.to(`group:${groupId}`).emit('user:joined', { userId });
    });

    // Leave group room
    socket.on('group:leave', (groupId: string) => {
      socket.leave(`group:${groupId}`);
      logger.info(`User ${userId} left group room ${groupId}`);

      // Notify others in the group
      socket.to(`group:${groupId}`).emit('user:left', { userId });
    });

    // User typing indicator
    socket.on('user:typing', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('user:typing', { userId });
    });

    // Expense created (broadcast to group)
    socket.on('expense:created', ({ groupId, expense, updatedBalances }) => {
      io.to(`group:${groupId}`).emit('expense:created', {
        expense,
        updatedBalances,
        animation: 'chip-toss',
      });
      logger.info(`Expense broadcast to group ${groupId}`);
    });

    // Payment settled (broadcast to group)
    socket.on('payment:settled', ({ groupId, from, to, amount }) => {
      io.to(`group:${groupId}`).emit('payment:settled', {
        from,
        to,
        amount,
        animation: 'chip-pass',
      });
      logger.info(`Payment settlement broadcast to group ${groupId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.io handlers initialized');
}
