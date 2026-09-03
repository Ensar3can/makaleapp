import { requirePageSession } from '../../../lib/auth/session';
import { PageHeading } from '../../../components/page-heading';
import { ProfileForm } from './profile-form';
import { Card } from '../../../components/ui/card';

export default async function ProfileSettingsPage() {
  const session = await requirePageSession();

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Settings"
        title="Your profile"
        description={
          <>
            Username <strong>{session.profile?.username ?? '—'}</strong> cannot be changed after
            registration.
          </>
        }
      />
      <Card className="p-6 md:p-8">
        <ProfileForm
          displayName={session.profile?.displayName ?? ''}
          bio={session.profile?.bio ?? ''}
          websiteUrl={session.profile?.websiteUrl ?? ''}
        />
      </Card>
    </div>
  );
}
