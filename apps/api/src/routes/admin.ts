/**
 * Admin Routes
 * 
 * Provides administrative functionality for the Databuddy platform.
 */

import { Hono } from 'hono';
import { initClickHouseSchema } from '@databuddy/db';
import { createLogger } from '@databuddy/logger';
import { AppVariables } from '../types';

// Initialize logger for admin routes
const logger = createLogger('admin:routes');

// Create admin router
const adminRouter = new Hono<{ Variables: AppVariables }>();

/**
 * Initialize ClickHouse tables
 * POST /admin/init-tables
 */
adminRouter.post('/init-tables', async (c) => {
  try {
    logger.info('Initializing ClickHouse tables...');
    const result = await initClickHouseSchema();
    
    if (result.success) {
      logger.info('ClickHouse tables initialized successfully');
      return c.json(result, 200);
    } else {
      logger.error('Failed to initialize ClickHouse tables:', result.error);
      return c.json(result, 500);
    }
  } catch (error) {
    logger.error('Error in init-tables endpoint:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default adminRouter; 