import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';

const connection = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(connection, { schema: { ...schema, ...authSchema } });
