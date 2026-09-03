'use client';

import { useEffect, useState } from 'react';
import { FormStatus, TextLink } from '../../../components/auth-card';
import { showToast } from '../../../lib/toast-store';

export function VerifyEmailClient({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(token ? null : 'This verification link is missing a token.');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { error?: { message: string } };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const message = payload.error?.message ?? 'Unable to verify this email.';
          setError(message);
          showToast({ tone: 'error', message });
          return;
        }

        const message = 'Email verified. You can continue to your dashboard.';
        setSuccess(message);
        showToast({ tone: 'success', message });
      })
      .catch(() => {
        if (!cancelled) {
          const message = 'Unable to verify this email.';
          setError(message);
          showToast({ tone: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-4">
      <FormStatus error={error} success={success} />
      {!error && !success ? <p className="text-sm text-muted">Confirming your email…</p> : null}
      <div className="flex justify-between">
        <TextLink href="/login">Sign in</TextLink>
        <TextLink href="/dashboard">Go to dashboard</TextLink>
      </div>
    </div>
  );
}
