import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tablesplit';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB:', error);
    throw error;
  }
}
