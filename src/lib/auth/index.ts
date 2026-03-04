import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'client',
        input: false,
      },
      clientId: {
        type: 'number',
        required: false,
        input: false,
      },
      teamMemberId: {
        type: 'number',
        required: false,
        input: false,
      },
    },
  },
});
