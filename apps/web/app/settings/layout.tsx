import type { ReactNode } from 'react';
import Link from 'next/link';
import { MainContent } from '../../components/main-content';
import { SiteFooter } from '../../components/site-footer';
import { AppHeader } from '../../components/ui/app-header';
import { requirePageSession } from '../../lib/auth/session';
import { LogoutButton } from '../dashboard/logout-button';
import { SettingsNav } from './settings-nav';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requirePageSession();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader>
        <Link href="/" className="nav-link">
          Discover
        </Link>
        <Link href="/dashboard" className="nav-link">
          Dashboard
        </Link>
        <Link href="/dashboard/articles" className="nav-link">
          Articles
        </Link>
        <Link href="/settings/profile" className="nav-link">
          Profile
        </Link>
        <LogoutButton />
      </AppHeader>
      <div className="mx-auto grid w-full max-w-page flex-1 gap-10 px-4 py-10 md:px-12 md:py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
        <SettingsNav />
        <MainContent className="min-w-0">{children}</MainContent>
      </div>
      <SiteFooter />
    </div>
  );
}
