import { Server, Socket } from 'socket.io';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Track online users per group: groupId -> Set of userIds
const onlineUsersPerGroup = new Map<string, Set<string>>();

// Track user activity: userId -> { groupId, activity, timestamp }
const userActivity = new Map<string, { groupId: string; activity: string; timestamp: number }>();

// Track socket to user mapping
const socketToUser = new Map<string, string>();

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

    // Track socket to user mapping
    socketToUser.set(socket.id, userId);

    // Join group room
    socket.on('group:join', (groupId: string) => {
      socket.join(`group:${groupId}`);
      logger.info(`User ${userId} joined group room ${groupId}`);

      // Add user to online users for this group
      if (!onlineUsersPerGroup.has(groupId)) {
        onlineUsersPerGroup.set(groupId, new Set());
      }
      onlineUsersPerGroup.get(groupId)!.add(userId);

      // Broadcast updated online users list to all in group
      const onlineUsers = Array.from(onlineUsersPerGroup.get(groupId) || []);
      io.to(`group:${groupId}`).emit('users:online', { onlineUsers });

      // Notify others in the group
      socket.to(`group:${groupId}`).emit('user:joined', { userId });
    });

    // Leave group room
    socket.on('group:leave', (groupId: string) => {
      socket.leave(`group:${groupId}`);
      logger.info(`User ${userId} left group room ${groupId}`);

      // Remove user from online users for this group
      if (onlineUsersPerGroup.has(groupId)) {
        onlineUsersPerGroup.get(groupId)!.delete(userId);
        if (onlineUsersPerGroup.get(groupId)!.size === 0) {
          onlineUsersPerGroup.delete(groupId);
        } else {
          // Broadcast updated online users list
          const onlineUsers = Array.from(onlineUsersPerGroup.get(groupId)!);
          io.to(`group:${groupId}`).emit('users:online', { onlineUsers });
        }
      }

      // Clear activity
      userActivity.delete(userId);
      io.to(`group:${groupId}`).emit('user:activity', { userId, activity: null });

      // Notify others in the group
      socket.to(`group:${groupId}`).emit('user:left', { userId });
    });

    // User typing indicator
    socket.on('user:typing', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('user:typing', { userId });
    });

    // User activity update
    socket.on('user:activity', ({ groupId, activity }: { groupId: string; activity: string | null }) => {
      if (activity) {
        userActivity.set(userId, { groupId, activity, timestamp: Date.now() });
      } else {
        userActivity.delete(userId);
      }

      // Broadcast activity to others in group
      socket.to(`group:${groupId}`).emit('user:activity', { userId, activity });
      logger.info(`User ${userId} activity in group ${groupId}: ${activity}`);
    });

    // Get current online users for a group
    socket.on('users:get-online', ({ groupId }: { groupId: string }) => {
      const onlineUsers = Array.from(onlineUsersPerGroup.get(groupId) || []);
      socket.emit('users:online', { onlineUsers });
    });

    // Get current activities for a group
    socket.on('users:get-activities', ({ groupId }: { groupId: string }) => {
      const activities: Record<string, string> = {};
      userActivity.forEach((data, uid) => {
        if (data.groupId === groupId) {
          activities[uid] = data.activity;
        }
      });
      socket.emit('users:activities', { activities });
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

      // Clean up: remove user from all groups they were in
      onlineUsersPerGroup.forEach((users, groupId) => {
        if (users.has(userId)) {
          users.delete(userId);

          // Broadcast updated online users list
          const onlineUsers = Array.from(users);
          io.to(`group:${groupId}`).emit('users:online', { onlineUsers });

          // Notify others
          socket.to(`group:${groupId}`).emit('user:left', { userId });
        }

        // Clean up empty groups
        if (users.size === 0) {
          onlineUsersPerGroup.delete(groupId);
        }
      });

      // Clear activity
      userActivity.delete(userId);

      // Remove socket mapping
      socketToUser.delete(socket.id);
    });
  });

  logger.info('Socket.io handlers initialized');
}
