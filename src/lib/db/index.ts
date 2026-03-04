import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';

// Single connection as superuser. RLS is enforced inside transactions via
// SET LOCAL ROLE rls_user — see src/lib/db/rls-client.ts.
const connection = postgres(process.env.DATABASE_URL!, { prepare: false });
export const adminDb = drizzle(connection, { schema: { ...schema, ...authSchema } });

// Alias for BetterAuth adapter compatibility — must remain adminDb
export const db = adminDb;
