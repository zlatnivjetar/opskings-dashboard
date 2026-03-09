import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/get-user-context';
import { ResponseTimeContent } from '@/components/dashboard/ResponseTimeContent';

export default async function ResponseTimePage() {
  const ctx = await getUserContext();
  if (ctx.role !== 'team_member') {
    redirect('/portal');
  }

  return <ResponseTimeContent />;
}
