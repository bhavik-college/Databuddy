
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import basketRouter from './routes/basket';
import { logger } from './lib/logger';
const app = new Elysia();


app.use(cors({ origin: '*' }));

app.get('/', basketRouter);

app.get('/health', () => ({ status: 'ok', version: '1.0.0' }));

app.onError((err: any) => {
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  return {
    error: 'Internal Server Error',
    status: 500
  }
});

export default {
  fetch: app.fetch,
  port: process.env.PORT || 4001,
};
