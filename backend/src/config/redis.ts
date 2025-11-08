import { createClient } from 'redis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (error) => {
  logger.error('Redis Client Error:', error);
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from Redis:', error);
    throw error;
  }
}

export { redisClient };
