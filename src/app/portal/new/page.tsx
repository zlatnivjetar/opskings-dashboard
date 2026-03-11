import { getTicketTypes } from '@/lib/actions/reference';
import { NewTicketForm } from '@/components/portal/NewTicketForm';
import { Card } from '@/components/ui/card';

export default async function NewTicketPage() {
  const ticketTypes = await getTicketTypes();

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-page-title mb-6">New Ticket</h1>
      <Card className="p-5">
        <NewTicketForm ticketTypes={ticketTypes} />
      </Card>
    </div>
  );
}
