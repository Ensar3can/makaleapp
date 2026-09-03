'use client';

import { useState, type FormEvent } from 'react';
import { Field, FormStatus, PrimaryButton, TextLink } from '../../../components/auth-card';
import { SocialAuthUnavailable } from '../../../components/social-auth-unavailable';
import { DEFAULT_POST_LOGIN_PATH, loginHref } from '../../../lib/auth/safe-next-path';
import { showToast } from '../../../lib/toast-store';

export function RegisterForm({ next = DEFAULT_POST_LOGIN_PATH }: { next?: string }) {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          displayName: form.get('displayName'),
          username: form.get('username'),
        }),
      });
      const payload = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to create the account.');
        return;
      }

      const message = 'Account created. Check the server console for the verification link, then sign in.';
      setSuccess(message);
      showToast({ tone: 'success', message });
    } catch {
      setError('Unable to create the account.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormStatus error={error} success={success} />
      <Field label="Display name" name="displayName" autoComplete="name" />
      <Field label="Username" name="username" autoComplete="username" />
      <p className="text-xs text-muted">Lowercase letters, numbers, and hyphens only.</p>
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
      />
      <p className="text-xs text-muted">At least 12 characters, including a letter and a number.</p>
      <PrimaryButton pending={pending}>Create account</PrimaryButton>
      <TextLink href={loginHref(next)}>Already registered? Sign in</TextLink>
      <SocialAuthUnavailable />
    </form>
  );
}
