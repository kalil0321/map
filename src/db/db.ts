import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getDb() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return null;
    }

    const client = postgres(databaseUrl, {
        max: 10,
        idle_timeout: 30,
        connect_timeout: 10,
    });

    return drizzle(client, { schema });
}

export const db = getDb();
export { schema };
