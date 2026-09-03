'use client';

import { useState } from 'react';
import { flashToast, showToast } from '../../lib/toast-store';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });

      if (!response.ok) {
        const message = 'Unable to sign out.';
        setError(message);
        showToast({ tone: 'error', message });
        return;
      }

      flashToast({ tone: 'success', message: 'Signed out.' });
      window.location.assign('/login');
    } catch {
      const message = 'Unable to sign out.';
      setError(message);
      showToast({ tone: 'error', message });
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-1 lg:items-end">
      <Button
        type="button"
        variant="ghost"
        pending={pending}
        pendingLabel="Signing out…"
        onClick={() => void onClick()}
      >
        Sign out
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </span>
  );
}
