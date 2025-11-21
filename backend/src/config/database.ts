import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';
import { databaseSyncService } from '../services/database-sync.service';

export async function connectDatabase(): Promise<void> {
  try {
    const isProduction = env.NODE_ENV === 'production';

    // In development, sync from production to dev first
    if (!isProduction) {
      logger.info('Development mode detected - syncing from production database');

      // Get the base MongoDB URI (without database name)
      const baseUri = env.MONGODB_URI.replace(/\/[^/]+$/, '');
      const prodUri = `${baseUri}/table`;
      const devUri = `${baseUri}/table-dev`;

      try {
        await databaseSyncService.syncDatabases({
          sourceUri: prodUri,
          targetUri: devUri,
          sourceName: 'table (production)',
          targetName: 'table-dev (development)',
        });
      } catch (syncError) {
        logger.warn('Database sync failed, continuing with existing dev data');
        logger.warn(syncError instanceof Error ? syncError.message : String(syncError));
      }

      // Connect to dev database
      logger.info(`Connecting to development database (table-dev)...`);
      await mongoose.connect(`${baseUri}/table-dev`);
      logger.info('Connected to development database (table-dev)');
    } else {
      // In production, connect directly
      logger.info('Production mode - connecting to production database');
      await mongoose.connect(env.MONGODB_URI);
      logger.info('Connected to production database');
    }

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
