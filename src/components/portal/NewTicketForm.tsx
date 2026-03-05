'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/lib/queries/portal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

type TicketTypeOption = { id: number; typeName: string };

export function NewTicketForm({ ticketTypes }: { ticketTypes: TicketTypeOption[] }) {
  const router = useRouter();
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [priority, setPriority] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ticketId = await createTicket({
        ticketTypeId: Number(ticketTypeId),
        priority,
        title,
        message,
      });
      router.push(`/portal/tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-1.5">
        <Label>Ticket Type</Label>
        <Select value={ticketTypeId} onValueChange={setTicketTypeId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {ticketTypes.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.typeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={setPriority} required>
          <SelectTrigger>
            <SelectValue placeholder="Select priority…" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your issue"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail…"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !ticketTypeId || !priority || !title || !message}
      >
        {loading ? 'Creating…' : 'Create Ticket'}
      </Button>
    </form>
  );
}
