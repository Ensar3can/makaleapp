import { ReservedPage } from '../../../components/reserved-page';
import { requirePageSession } from '../../../lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  await requirePageSession();

  return (
    <ReservedPage
      kicker="Settings"
      title="Privacy"
      description="Public profiles already expose the fields you save on the Profile tab. There is no separate privacy policy engine."
      panelTitle="Privacy controls are not built"
      panelDescription="This Stitch tab stays empty. Profile visibility, follower graphs, and export/delete requests have no use cases in v1.0."
    />
  );
}
