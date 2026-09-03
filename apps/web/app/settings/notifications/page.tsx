import { ReservedPage } from '../../../components/reserved-page';
import { requirePageSession } from '../../../lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  await requirePageSession();

  return (
    <ReservedPage
      kicker="Settings"
      title="Notifications"
      description="Preference toggles need a notification store. v1.0 does not persist in-app or email notification settings."
      panelTitle="Notification preferences are not stored"
      panelDescription="This Stitch tab stays empty. Analysis and publish events are not delivered as a configurable inbox."
    />
  );
}
