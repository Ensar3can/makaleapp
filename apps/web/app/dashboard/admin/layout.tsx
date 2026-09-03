import type { ReactNode } from 'react';
import { requireAdminPage } from '../../../lib/auth/require-admin';
import { AdminSectionNav } from './admin-section-nav';

export default async function AdminSectionLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return (
    <div className="space-y-8">
      <AdminSectionNav />
      {children}
    </div>
  );
}
