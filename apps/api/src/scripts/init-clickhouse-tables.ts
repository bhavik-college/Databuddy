/**
 * Initialize ClickHouse Tables Script
 * 
 * This script creates all necessary ClickHouse tables for analytics tracking.
 * It uses the schema definitions from the @databuddy/db package.
 */

import { initClickHouseSchema } from '../clickhouse/schema';

const logger = console;

async function initTables() {
  try {
    logger.info('Starting initialization of ClickHouse tables...');
    logger.info('-----------------------------------------------');
    
    const result = await initClickHouseSchema();
    
    if (result.success) {
      logger.info('-----------------------------------------------');
      logger.info(`Success: ${result.message}`);
      
      // Handle details with type safety
      if (result.details?.database) {
        logger.info(`Database: ${result.details.database}`);
        
        if (result.details.tables) {
          logger.info('Tables created:');
          for (const table of result.details.tables) {
            logger.info(`- ${table}`);
          }
        }
      }
      
      return {
        success: true,
        message: result.message,
        details: result.details
      };
    }
    
    logger.error('-----------------------------------------------');
    logger.error(`Failed: ${result.message}`);
    logger.error(`Error: ${result.error || 'Unknown error'}`);
    
    return {
      success: false,
      message: result.message,
      error: result.error
    };
  } catch (error) {
    logger.error('-----------------------------------------------');
    logger.error('Unhandled error during initialization:', error);
    
    return {
      success: false,
      message: 'Initialization failed with unhandled error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the initialization if this script is run directly
if (import.meta.main) {
  initTables()
    .then(result => {
      if (result.success) {
        logger.info('ClickHouse tables initialized successfully');
        process.exit(0);
      } else {
        logger.error('ClickHouse tables initialization failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default initTables; 