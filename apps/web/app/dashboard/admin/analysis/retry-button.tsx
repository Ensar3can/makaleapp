'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showToast } from '../../../../lib/toast-store';
import { Alert } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';

export function RetryAnalysisJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requeued, setRequeued] = useState(false);

  async function retry() {
    setPending(true);
    setError(null);
    setRequeued(true);

    try {
      const response = await fetch(`/api/admin/analysis-jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as {
        error?: { message?: string } | null;
      };

      if (!response.ok) {
        setRequeued(false);
        const message = payload.error?.message ?? 'Retry failed';
        setError(message);
        showToast({ tone: 'error', message });
        return;
      }

      showToast({ tone: 'success', message: 'Job requeued.' });
      router.refresh();
    } catch {
      setRequeued(false);
      const message = 'Retry failed';
      setError(message);
      showToast({ tone: 'error', message });
    } finally {
      setPending(false);
    }
  }

  if (requeued && !error) {
    return <p className="text-xs font-medium text-accent">Requeued</p>;
  }

  return (
    <div>
      <Button
        type="button"
        variant="danger"
        pending={pending}
        pendingLabel="Requeueing…"
        className="px-2 py-1 text-xs"
        onClick={() => void retry()}
      >
        Requeue
      </Button>
      {error ? (
        <div className="mt-1">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}
