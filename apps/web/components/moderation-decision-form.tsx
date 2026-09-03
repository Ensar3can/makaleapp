'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { flashToast } from '../lib/toast-store';
import { FormStatus } from './ui/alert';
import { Button } from './ui/button';
import { SelectField, TextareaField } from './ui/field';

export function ModerationDecisionForm({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const decision = String(form.get('decision') ?? '');
    const reason = String(form.get('reason') ?? '');
    const notes = String(form.get('notes') ?? '');

    try {
      const response = await fetch(`/api/admin/articles/${articleId}/moderate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, reason, notes: notes.length > 0 ? notes : undefined }),
      });
      const body = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(body.error?.message ?? 'Moderation failed');
        return;
      }

      flashToast({ tone: 'success', message: moderationSuccessMessage(decision) });
      router.push('/dashboard/moderation');
      router.refresh();
    } catch {
      setError('Moderation failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <FormStatus error={error} />
      <SelectField name="decision" label="Decision" required defaultValue="APPROVE">
        <option value="APPROVE">Approve</option>
        <option value="REQUEST_REVISION">Request revision</option>
        <option value="REJECT">Reject</option>
      </SelectField>
      <TextareaField name="reason" label="Reason" required minLength={8} rows={3} />
      <TextareaField name="notes" label="Notes" rows={3} />
      <Button type="submit" variant="primary" pending={pending}>
        Record decision
      </Button>
    </form>
  );
}

function moderationSuccessMessage(decision: string): string {
  if (decision === 'APPROVE') {
    return 'Article approved.';
  }

  if (decision === 'REQUEST_REVISION') {
    return 'Revision requested.';
  }

  if (decision === 'REJECT') {
    return 'Article rejected.';
  }

  return 'Moderation decision recorded.';
}
