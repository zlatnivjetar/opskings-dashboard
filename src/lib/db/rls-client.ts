import { sql } from 'drizzle-orm';
import { adminDb } from './index';

type UserContext = {
  userId: string;
  role: 'team_member' | 'client';
  clientId: number | null;
  teamMemberId: number | null;
};

export async function withRLS<T>(
  ctx: UserContext,
  fn: (tx: Parameters<Parameters<typeof adminDb.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return adminDb.transaction(async (tx) => {
    // Assume rls_user for the duration of this transaction only.
    // SET LOCAL automatically resets to the original role on commit or rollback.
    await tx.execute(sql`SET LOCAL ROLE rls_user`);
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_role', ${ctx.role}, true)`);
    await tx.execute(sql`SELECT set_config('app.client_id', ${ctx.clientId ? String(ctx.clientId) : ''}, true)`);
    await tx.execute(sql`SELECT set_config('app.team_member_id', ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''}, true)`);
    return fn(tx);
  });
}
