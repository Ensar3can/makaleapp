import { AuthCard } from '../../../components/auth-card';
import { authPageMetadata } from '../../../lib/auth/page-metadata';
import { ResetPasswordForm } from './reset-form';

export const metadata = authPageMetadata(
  'Reset password',
  'Choose a new password. Existing sessions will be revoked.',
);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard title="Reset password" subtitle="Choose a new password. Existing sessions will be revoked.">
      <ResetPasswordForm token={params.token ?? ''} />
    </AuthCard>
  );
}
