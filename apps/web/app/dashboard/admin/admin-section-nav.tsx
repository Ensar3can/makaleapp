'use client';

import { usePathname } from 'next/navigation';
import { TabNav } from '../../../components/ui/side-nav';

const ITEMS = [
  { href: '/dashboard/admin', label: 'Overview' },
  { href: '/dashboard/admin/analysis', label: 'Analysis jobs' },
  { href: '/dashboard/moderation', label: 'Moderation' },
  { href: '/dashboard/admin/categories', label: 'Categories' },
  { href: '/dashboard/admin/users', label: 'Users' },
] as const;

export function AdminSectionNav() {
  const pathname = usePathname();

  return <TabNav label="Administration" items={ITEMS} pathname={pathname} />;
}
