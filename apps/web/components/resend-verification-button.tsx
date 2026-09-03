'use client';

import { useState } from 'react';
import { FormStatus } from './ui/alert';
import { Button } from './ui/button';
import { showToast } from '../lib/toast-store';

export function ResendVerificationButton() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to resend the verification email.');
        return;
      }

      const message = 'A new verification link was sent. Locally it appears in the server console.';
      setSuccess(message);
      showToast({ tone: 'success', message });
    } catch {
      setError('Unable to resend the verification email.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <FormStatus error={error} success={success} />
      <Button type="button" variant="secondary" pending={pending} onClick={() => void onClick()}>
        Resend verification email
      </Button>
    </div>
  );
}
