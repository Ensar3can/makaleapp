'use client';

import { useState, type FormEvent } from 'react';
import { showToast } from '../../../lib/toast-store';
import { FormStatus } from '../../../components/ui/alert';
import { PrimaryButton } from '../../../components/ui/button';
import { TextareaField, TextField } from '../../../components/ui/field';

export function ProfileForm({
  displayName,
  bio,
  websiteUrl,
}: {
  displayName: string;
  bio: string;
  websiteUrl: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const website = String(form.get('websiteUrl') ?? '').trim();

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.get('displayName'),
          bio: form.get('bio'),
          websiteUrl: website.length > 0 ? website : null,
        }),
      });
      const payload = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Unable to update the profile.');
        return;
      }

      setSuccess('Profile saved.');
      showToast({ tone: 'success', message: 'Profile saved.' });
    } catch {
      setError('Unable to update the profile.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <FormStatus error={error} success={success} />
      <TextField name="displayName" label="Display name" defaultValue={displayName} required />
      <TextareaField name="bio" label="Bio" defaultValue={bio} rows={4} />
      <TextField name="websiteUrl" label="Website" type="url" defaultValue={websiteUrl} placeholder="https://" />
      <PrimaryButton pending={pending}>Save profile</PrimaryButton>
    </form>
  );
}
