import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Reuse a single connection across hot reloads in development so we do not
// exhaust Postgres connections.
const globalForDb = globalThis as unknown as { veydriaPg?: ReturnType<typeof postgres> };

const client = globalForDb.veydriaPg ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.veydriaPg = client;
}

export const db = drizzle(client, { schema, casing: 'snake_case' });
export { client, schema };
export type Database = typeof db;
