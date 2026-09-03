'use client';

import { useState, type FormEvent } from 'react';
import { Field, FormStatus, PrimaryButton, TextLink } from '../../../components/auth-card';
import { SocialAuthUnavailable } from '../../../components/social-auth-unavailable';
import { DEFAULT_POST_LOGIN_PATH, registerHref, safeInternalPath } from '../../../lib/auth/safe-next-path';
import { flashToast } from '../../../lib/toast-store';

export function LoginForm({ next = DEFAULT_POST_LOGIN_PATH }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const destination = safeInternalPath(next);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      const payload = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to sign in.');
        return;
      }

      flashToast({ tone: 'success', message: 'Signed in.' });
      window.location.assign(destination);
    } catch {
      setError('Unable to sign in.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormStatus error={error} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      <PrimaryButton pending={pending}>Sign in</PrimaryButton>
      <div className="flex justify-between">
        <TextLink href="/forgot-password">Forgot password</TextLink>
        <TextLink href={registerHref(destination)}>Create an account</TextLink>
      </div>
      <SocialAuthUnavailable />
    </form>
  );
}
