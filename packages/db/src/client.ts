import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as relations from './drizzle/relations';
import * as schema from './drizzle/schema';

// Combine schema and relations
const fullSchema = { ...schema, ...relations };

const databaseUrl = process.env.DATABASE_URL as string;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema: fullSchema });
