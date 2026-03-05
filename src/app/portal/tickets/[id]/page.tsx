import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTicketDetail } from '@/lib/queries/portal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from '@/components/portal/FeedbackForm';

function StatusBadge({ status }: { status: string }) {
  if (status === 'open') return <Badge variant="destructive">open</Badge>;
  if (status === 'in_progress')
    return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">in progress</Badge>;
  if (status === 'resolved')
    return <Badge className="bg-green-600 hover:bg-green-600 text-white">resolved</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'urgent') return <Badge variant="destructive">urgent</Badge>;
  if (priority === 'high')
    return <Badge className="bg-orange-500 hover:bg-orange-500 text-white">high</Badge>;
  if (priority === 'medium') return <Badge variant="secondary">medium</Badge>;
  return <Badge variant="outline">low</Badge>;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);

  if (!ticketId || isNaN(ticketId)) notFound();

  const data = await getTicketDetail(ticketId);
  if (!data) notFound();

  const { ticket, messages, feedback } = data;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link href="/portal">
        <Button variant="ghost" size="sm" className="pl-0">
          ← My Tickets
        </Button>
      </Link>

      {/* Ticket header */}
      <div className="border rounded-lg p-5 space-y-3">
        <h1 className="text-xl font-bold">{ticket.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{ticket.typeName}</span>
          <span>·</span>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <span>·</span>
          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
          {ticket.resolvedAt && (
            <>
              <span>·</span>
              <span>Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Messages
        </h2>

        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.fromClient ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 space-y-1 ${
                    msg.fromClient
                      ? 'bg-blue-100 dark:bg-blue-950'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                  <p className="text-xs text-muted-foreground">
                    {msg.fromClient ? 'You' : (msg.teamMemberName ?? 'Support Team')}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing feedback */}
      {feedback && (
        <div className="border rounded-lg p-4 space-y-1">
          <h2 className="font-semibold">Your Feedback</h2>
          <p className="text-sm">
            Rating:{' '}
            <span className="font-medium">{feedback.rating}/5</span>
          </p>
          {feedback.feedbackText && (
            <p className="text-sm text-muted-foreground">{feedback.feedbackText}</p>
          )}
        </div>
      )}

      {/* Feedback form — only if resolved and no feedback yet */}
      {ticket.status === 'resolved' && !feedback && (
        <FeedbackForm ticketId={ticket.id} />
      )}
    </div>
  );
}
