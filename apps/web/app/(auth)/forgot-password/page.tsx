import { AuthCard } from '../../../components/auth-card';
import { authPageMetadata } from '../../../lib/auth/page-metadata';
import { ForgotPasswordForm } from './forgot-form';

export const metadata = authPageMetadata(
  'Forgot password',
  'Request a password reset link. The response does not reveal whether the email exists.',
);

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot password" subtitle="We always return the same response so account existence is not leaked.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
