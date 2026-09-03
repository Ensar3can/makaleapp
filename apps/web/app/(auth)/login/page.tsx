import { redirect } from 'next/navigation';
import { AuthCard } from '../../../components/auth-card';
import { getOptionalPageSession } from '../../../lib/auth/session';
import { authPageMetadata } from '../../../lib/auth/page-metadata';
import { safeInternalPath } from '../../../lib/auth/safe-next-path';
import { LoginForm } from './login-form';

export const metadata = authPageMetadata(
  'Sign in',
  'Sign in with email and password. Sessions are stored in an HttpOnly cookie.',
);

export default async function LoginPage({
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
    <AuthCard title="Sign in" subtitle="Use your email and password. Sessions are stored in an HttpOnly cookie.">
      <LoginForm next={next} />
    </AuthCard>
  );
}
