import pino from 'pino';
import { H } from '@highlight-run/node';
import type { NodeOptions } from '@highlight-run/node';

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Format error objects consistently
const formatError = (error: Error) => ({
  message: error.message,
  stack: error.stack,
  name: error.name,
  ...error,
});

// Highlight.io configuration
const highlightConfig: NodeOptions = process.env.HIGHLIGHT_PROJECT_ID ? {
  projectID: process.env.HIGHLIGHT_PROJECT_ID,
  serviceName: process.env.SERVICE_NAME || 'databuddy',
  serviceVersion: process.env.SERVICE_VERSION,
} : undefined;

// Initialize Highlight.io if configured
if (highlightConfig) {
  H.init(highlightConfig);
}

// Base logger configuration
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    '*.password',
    '*.token',
    '*.secret',
    '*.cookie',
    '*.authorization',
    '*.sessionToken',
    '*.apiKey',
  ],
  serializers: {
    err: (err: Error) => formatError(err),
    error: (err: Error) => formatError(err),
  },
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
    // Add bindings for service name
    bindings: () => {
      return {
        service: `${process.env.SERVICE_NAME || 'databuddy'}-${process.env.NODE_ENV || 'dev'}`,
      };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};

// Development configuration with pretty printing
const developmentConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
    },
  },
};

// Test configuration (minimal output)
const testConfig = {
  ...baseConfig,
  level: 'error',
  enabled: false,
};

// Production configuration with Highlight.io transport
const productionConfig = {
  ...baseConfig,
  transport: highlightConfig ? {
    target: '@highlight-run/pino',
    options: highlightConfig,
  } : undefined,
};

// Select configuration based on environment
const config = isDevelopment 
  ? developmentConfig 
  : isTest 
    ? testConfig 
    : productionConfig;

// Create the logger instance with additional levels
export const logger = pino({
  ...config,
  customLevels: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  },
});

// Create child logger with additional context
export const createLogger = (name: string, metadata = {}) => {
  return logger.child({
    service: `${name}-${process.env.NODE_ENV || 'dev'}`,
    ...metadata,
  });
};

// Export types
export type Logger = typeof logger;
export type LogFn = Logger['info'];

// Export utility functions
export const logError = (error: Error | unknown, context = {}) => {
  if (error instanceof Error) {
    logger.error({
      error: formatError(error),
      ...context,
    });
  } else {
    logger.error({
      error,
      ...context,
    });
  }
};

// HTTP request logger middleware
export const requestLogger = () => {
  const reqLogger = createLogger('http');
  
  return (req: any, res: any, next: Function) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      reqLogger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });
    
    next();
  };
};

// Export default logger
export default logger; 