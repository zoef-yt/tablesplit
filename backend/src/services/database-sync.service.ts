import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface SyncOptions {
  sourceUri: string;
  targetUri: string;
  sourceName: string;
  targetName: string;
}

/**
 * Service to sync data from production database to development database
 */
export class DatabaseSyncService {
  /**
   * Sync all collections from source database to target database
   */
  async syncDatabases(options: SyncOptions): Promise<void> {
    const { sourceUri, targetUri, sourceName, targetName } = options;

    logger.info('='.repeat(60));
    logger.info('DATABASE SYNC STARTED');
    logger.info('='.repeat(60));
    logger.info(`Source: ${sourceName} (${this.maskUri(sourceUri)})`);
    logger.info(`Target: ${targetName} (${this.maskUri(targetUri)})`);

    let sourceConnection: mongoose.Connection | null = null;
    let targetConnection: mongoose.Connection | null = null;

    try {
      // Connect to source (production) database
      logger.info(`[1/5] Connecting to source database (${sourceName})...`);
      sourceConnection = await mongoose.createConnection(sourceUri).asPromise();
      logger.info(`[1/5] Connected to source database`);

      // Connect to target (dev) database
      logger.info(`[2/5] Connecting to target database (${targetName})...`);
      targetConnection = await mongoose.createConnection(targetUri).asPromise();
      logger.info(`[2/5] Connected to target database`);

      // Verify db connections
      const sourceDb = sourceConnection.db;
      const targetDb = targetConnection.db;

      if (!sourceDb || !targetDb) {
        throw new Error('Failed to get database references');
      }

      // Get all collections from source
      logger.info(`[3/5] Fetching collections from source...`);
      const collections = await sourceDb.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      logger.info(`[3/5] Found ${collectionNames.length} collections: ${collectionNames.join(', ')}`);

      // Clear target database
      logger.info(`[4/5] Clearing target database...`);
      for (const collectionName of collectionNames) {
        try {
          await targetDb.collection(collectionName).deleteMany({});
          logger.info(`  - Cleared collection: ${collectionName}`);
        } catch (err) {
          // Collection might not exist yet, that's ok
          logger.debug(`  - Collection ${collectionName} doesn't exist in target, will create`);
        }
      }
      logger.info(`[4/5] Target database cleared`);

      // Copy data from source to target
      logger.info(`[5/5] Copying data from source to target...`);
      let totalDocuments = 0;

      for (const collectionName of collectionNames) {
        const sourceCollection = sourceDb.collection(collectionName);
        const targetCollection = targetDb.collection(collectionName);

        // Get all documents from source
        const documents = await sourceCollection.find({}).toArray();

        if (documents.length > 0) {
          // Insert into target
          await targetCollection.insertMany(documents);
          totalDocuments += documents.length;
          logger.info(`  - Copied ${documents.length} documents to ${collectionName}`);
        } else {
          logger.info(`  - Skipped ${collectionName} (empty)`);
        }
      }

      logger.info(`[5/5] Data copy complete`);
      logger.info('='.repeat(60));
      logger.info('DATABASE SYNC COMPLETED SUCCESSFULLY');
      logger.info(`Total: ${totalDocuments} documents copied across ${collectionNames.length} collections`);
      logger.info('='.repeat(60));

    } catch (error) {
      logger.error('DATABASE SYNC FAILED');
      logger.error(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      // Close connections
      if (sourceConnection) {
        await sourceConnection.close();
        logger.info(`Closed connection to source database`);
      }
      if (targetConnection) {
        await targetConnection.close();
        logger.info(`Closed connection to target database`);
      }
    }
  }

  /**
   * Mask sensitive parts of URI for logging
   */
  private maskUri(uri: string): string {
    // Replace password if present
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  }
}

export const databaseSyncService = new DatabaseSyncService();
