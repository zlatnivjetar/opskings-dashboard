'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitFeedback } from '@/lib/queries/portal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackForm({ ticketId }: { ticketId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    setError('');

    try {
      await submitFeedback(ticketId, rating, feedbackText);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="font-semibold">Leave Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-1.5">
          <Label>Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${
                  rating >= n
                    ? 'bg-yellow-400 border-yellow-500 text-white'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="feedback-text">Comment (optional)</Label>
          <Textarea
            id="feedback-text"
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="How was your experience?"
          />
        </div>

        <Button type="submit" disabled={loading || rating === 0}>
          {loading ? 'Submitting…' : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
}
