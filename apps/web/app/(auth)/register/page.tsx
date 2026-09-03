import { redirect } from 'next/navigation';
import { AuthCard } from '../../../components/auth-card';
import { getOptionalPageSession } from '../../../lib/auth/session';
import { authPageMetadata } from '../../../lib/auth/page-metadata';
import { safeInternalPath } from '../../../lib/auth/safe-next-path';
import { RegisterForm } from './register-form';

export const metadata = authPageMetadata(
  'Create an account',
  'Registration creates your user and public profile. Email verification is required before submit and publish.',
);

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const [session, params] = await Promise.all([getOptionalPageSession(), searchParams]);
  const next = safeInternalPath(Array.isArray(params.next) ? params.next[0] : params.next);

  if (session) {
    redirect(next);
  }

  return (
    <AuthCard title="Create an account" subtitle="Registration creates your user and public profile. You can sign in immediately; email verification is optional until later publishing rules.">
      <RegisterForm next={next} />
    </AuthCard>
  );
}
