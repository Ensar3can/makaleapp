import { ReservedPage } from '../../../components/reserved-page';
import { ButtonLink } from '../../../components/ui/button';
import { requirePageSession } from '../../../lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function NotificationsInboxPage() {
  await requirePageSession();

  return (
    <ReservedPage
      kicker="Workspace"
      title="Notifications"
      description="The product does not persist an in-app notification inbox."
      panelTitle="No notifications"
      panelDescription="This Stitch empty state is honest: there is no notification feed to render, so no mock alerts are shown."
      action={
        <ButtonLink href="/dashboard" variant="secondary">
          Back to dashboard
        </ButtonLink>
      }
    />
  );
}
