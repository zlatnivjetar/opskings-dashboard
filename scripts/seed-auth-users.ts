/**
 * Seeds BetterAuth users for testing.
 * Run with: npm run seed:auth
 *
 * Because role/clientId/teamMemberId have `input: false`, they cannot be set
 * during signup. We create the user via BetterAuth, then patch the row directly.
 *
 * dotenv must be loaded before any db/auth modules — use dynamic import.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const users = [
  { name: 'John Smith',       email: 'john@company.com',    password: 'password123', role: 'team_member', clientId: null as number | null, teamMemberId: 1 as number | null },
  { name: 'Sarah Jones',      email: 'sarah@company.com',   password: 'password123', role: 'team_member', clientId: null as number | null, teamMemberId: 2 as number | null },
  { name: 'TechStart Admin',  email: 'admin@techstart.com', password: 'password123', role: 'client',      clientId: 1 as number | null,   teamMemberId: null as number | null },
  { name: 'GrowthCo Contact', email: 'contact@growthco.io', password: 'password123', role: 'client',      clientId: 2 as number | null,   teamMemberId: null as number | null },
];

async function main() {
  // Dynamic import ensures dotenv has already populated process.env
  const { auth } = await import('../src/lib/auth');
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  for (const u of users) {
    process.stdout.write(`  ${u.email}... `);

    const [existing] = await sql`SELECT id FROM "user" WHERE email = ${u.email}`;

    if (existing) {
      await sql`
        UPDATE "user"
        SET role = ${u.role}, client_id = ${u.clientId}, team_member_id = ${u.teamMemberId}
        WHERE email = ${u.email}
      `;
      console.log('updated');
      continue;
    }

    // Create via BetterAuth so password hashing is handled correctly
    await auth.api.signUpEmail({
      body: { name: u.name, email: u.email, password: u.password },
    });

    // Patch additionalFields (input: false prevents setting them during signup)
    await sql`
      UPDATE "user"
      SET role = ${u.role}, client_id = ${u.clientId}, team_member_id = ${u.teamMemberId}
      WHERE email = ${u.email}
    `;

    console.log('created');
  }

  await sql.end();
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
