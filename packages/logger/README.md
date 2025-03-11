# @databuddy/logger

A powerful logging utility for the DataBuddy monorepo, built with Pino and Highlight.io integration.

## Features

- Environment-aware configuration (development, test, production)
- Pretty printing in development
- Redaction of sensitive data
- Highlight.io integration for production monitoring
- Request logging middleware
- Child loggers with context
- TypeScript support
- Error logging utilities

## Installation

```bash
bun add @databuddy/logger
```

## Usage

### Basic Logging

```typescript
import { logger } from '@databuddy/logger';

logger.info('Hello world');
logger.error({ err: new Error('Something went wrong') }, 'Error occurred');
```

### Creating a Context Logger

```typescript
import { createLogger } from '@databuddy/logger';

const moduleLogger = createLogger('module-name', { additionalContext: 'value' });
moduleLogger.info('This log will include the module context');
```

### HTTP Request Logging

```typescript
import { requestLogger } from '@databuddy/logger';
import express from 'express';

const app = express();
app.use(requestLogger());
```

### Error Logging

```typescript
import { logError } from '@databuddy/logger';

try {
  // Some code that might throw
} catch (error) {
  logError(error, { additionalContext: 'value' });
}
```

## Configuration

The logger can be configured through environment variables:

- `NODE_ENV`: Determines the logging configuration ('development', 'test', 'production')
- `LOG_LEVEL`: Sets the minimum log level (default: 'info')
- `HIGHLIGHT_PROJECT_ID`: Enables Highlight.io integration when set

## Security

Sensitive data is automatically redacted from logs, including:
- Passwords
- Tokens
- Secrets
- Cookies
- Authorization headers
- Session tokens

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun run test

# Development with watch mode
bun run dev
``` 