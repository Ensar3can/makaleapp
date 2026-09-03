'use client';

import { useState, type FormEvent } from 'react';
import { Field, FormStatus, PrimaryButton, TextLink } from '../../../components/auth-card';
import { showToast } from '../../../lib/toast-store';

export function ForgotPasswordForm() {
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email') }),
      });
      const payload = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to start a password reset.');
        return;
      }

      const message = 'If that email exists, a reset link was sent. Locally it appears in the server console.';
      setSuccess(message);
      showToast({ tone: 'success', message });
    } catch {
      setError('Unable to start a password reset.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormStatus error={error} success={success} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <PrimaryButton pending={pending}>Send reset link</PrimaryButton>
      <TextLink href="/login">Back to sign in</TextLink>
    </form>
  );
}
