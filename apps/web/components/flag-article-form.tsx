'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { flashToast } from '../lib/toast-store';
import { FormStatus } from './ui/alert';
import { Button } from './ui/button';
import { TextareaField } from './ui/field';

export function FlagArticleForm({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const reason = String(form.get('reason') ?? '');
    const notes = String(form.get('notes') ?? '');

    try {
      const response = await fetch(`/api/admin/articles/${articleId}/flag`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason, notes: notes.length > 0 ? notes : undefined }),
      });
      const body = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(body.error?.message ?? 'Unable to send this article to review.');
        return;
      }

      const message = 'Article sent to the review queue.';
      setSuccess(message);
      flashToast({ tone: 'success', message });
      router.push('/dashboard/moderation');
      router.refresh();
    } catch {
      setError('Unable to send this article to review.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <FormStatus error={error} success={success} />
      <TextareaField name="reason" label="Reason" required minLength={8} rows={3} />
      <TextareaField name="notes" label="Notes" rows={3} />
      <Button type="submit" variant="primary" pending={pending}>
        Send to review
      </Button>
    </form>
  );
}
