import type { ReactNode } from 'react';
import { ALERT_TONE_CLASS, type AlertTone } from './tokens';

export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={ALERT_TONE_CLASS[tone]}>
      {children}
    </p>
  );
}

export function FormStatus({
  error,
  success,
}: {
  error: string | null;
  success?: string | null;
}) {
  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (success) {
    return <Alert tone="success">{success}</Alert>;
  }

  return null;
}
