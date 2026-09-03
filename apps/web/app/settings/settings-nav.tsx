'use client';

import { usePathname } from 'next/navigation';
import { SideNav } from '../../components/ui/side-nav';

const ITEMS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/account', label: 'Account and security' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/privacy', label: 'Privacy' },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return <SideNav label="Settings" items={ITEMS} pathname={pathname} />;
}
