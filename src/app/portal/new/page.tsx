import { getTicketTypes } from '@/lib/actions/reference';
import { NewTicketForm } from '@/components/portal/NewTicketForm';

export default async function NewTicketPage() {
  const ticketTypes = await getTicketTypes();

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Ticket</h1>
      <NewTicketForm ticketTypes={ticketTypes} />
    </div>
  );
}
