import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql as drizzleSql } from 'drizzle-orm';
import * as schema from '../shared/schema';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL connection
const postgresClient = postgres(DATABASE_URL);
export const db = drizzle(postgresClient, { schema });

// PostgreSQL connection wrapper
export async function withDb<T>(fn: (database: typeof db) => Promise<T>): Promise<T> {
  try {
    return await fn(db);
  } catch (err: any) {
    console.error("[db] error", { message: err?.message });
    throw err;
  }
}

// Optional: quick smoke query for health checks
export async function dbHealthcheck(): Promise<{ ok: number }> {
  const result = await db.execute(drizzleSql`SELECT 1 as ok`);
  return result[0] as { ok: number };
}