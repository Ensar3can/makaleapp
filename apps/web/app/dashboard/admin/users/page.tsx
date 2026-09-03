import { ReservedPage } from '../../../../components/reserved-page';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <ReservedPage
      kicker="Admin"
      title="Users"
      description="Registration, sessions, and roles are enforced server-side. There is no admin user-management use case in v1.0."
      panelTitle="User management is not built"
      panelDescription="This Stitch screen stays empty. Role changes, suspension, and user search are not exposed because those use cases do not exist."
    />
  );
}
