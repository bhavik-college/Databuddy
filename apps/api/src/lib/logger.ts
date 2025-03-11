import { Logtail } from "@logtail/edge";

// Create a logger instance with Better Stack
export const logger = new Logtail("cEe8CU2VwLfsESg52QLAwPvp", {
    endpoint: 'https://s1222612.eu-nbg-2.betterstackdata.com',
    // Add additional Better Stack configuration
    batchSize: 10, // Send logs in batches of 10
    batchInterval: 1000, // Or when 1 second passes
});

// Log levels to ensure we only log important events
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}
