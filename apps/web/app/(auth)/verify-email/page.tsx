import { AuthCard } from '../../../components/auth-card';
import { authPageMetadata } from '../../../lib/auth/page-metadata';
import { VerifyEmailClient } from './verify-client';

export const metadata = authPageMetadata(
  'Verify email',
  'Confirm the address on your account. This is not a binary identity check.',
);

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard title="Verify email" subtitle="This confirms the address on your account. It is not a binary identity check.">
      <VerifyEmailClient token={params.token ?? ''} />
    </AuthCard>
  );
}
