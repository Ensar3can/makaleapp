import { ReservedPage } from '../../../components/reserved-page';
import { requirePageSession } from '../../../lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await requirePageSession();

  return (
    <ReservedPage
      kicker="Settings"
      title="Account and security"
      description={
        <>
          Signed in as <strong>{session.user.email}</strong>. Email and password changes from this
          screen are not available.
        </>
      }
      panelTitle="Account controls are not built"
      panelDescription="Password reset stays on the public forgot-password flow. There is no change-email, change-password, or delete-account use case on the signed-in settings surface."
    />
  );
}
