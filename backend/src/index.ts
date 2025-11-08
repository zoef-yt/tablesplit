import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './sockets';
import authRoutes from './api/auth';
import groupRoutes from './api/groups';
import expenseRoutes from './api/expenses';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

// Error handling
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected');

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`🎰 TableSplit backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
});

startServer();

export { app, io };
