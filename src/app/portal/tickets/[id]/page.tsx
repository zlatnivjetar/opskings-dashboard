import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTicketDetail } from '@/lib/queries/portal';
import { formatUsername } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from '@/components/portal/FeedbackForm';
import { STATUS_STYLES, PRIORITY_STYLES } from '@/lib/status-styles';

function StatusBadge({ status }: { status: string }) {
  const label = status === 'in_progress' ? 'in progress' : status;
  return (
    <Badge variant="secondary" className={STATUS_STYLES[status] ?? ''}>
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="secondary" className={PRIORITY_STYLES[priority] ?? ''}>
      {priority}
    </Badge>
  );
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
    <div className="p-6 space-y-6 max-w-3xl">
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
                      ? 'bg-primary/10'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                  <p className="text-xs text-muted-foreground">
                    {msg.fromClient ? 'You' : (msg.teamMemberName ? formatUsername(msg.teamMemberName) : 'Support Team')}
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
