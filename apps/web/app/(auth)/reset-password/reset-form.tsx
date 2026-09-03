'use client';

import { useState, type FormEvent } from 'react';
import { Field, FormStatus, PrimaryButton, TextLink } from '../../../components/auth-card';
import { showToast } from '../../../lib/toast-store';

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.get('password'),
        }),
      });
      const payload = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to reset the password.');
        return;
      }

      const message = 'Password updated. You can sign in with the new password.';
      setSuccess(message);
      showToast({ tone: 'success', message });
    } catch {
      setError('Unable to reset the password.');
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return <FormStatus error="This reset link is missing a token." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormStatus error={error} success={success} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={12} />
      <PrimaryButton pending={pending}>Update password</PrimaryButton>
      <TextLink href="/login">Back to sign in</TextLink>
    </form>
  );
}
