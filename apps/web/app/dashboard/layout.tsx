import type { ReactNode } from 'react';
import Link from 'next/link';
import { MainContent } from '../../components/main-content';
import { SiteFooter } from '../../components/site-footer';
import { AppHeader } from '../../components/ui/app-header';
import { requirePageSession } from '../../lib/auth/session';
import { LogoutButton } from './logout-button';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requirePageSession();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader>
        <Link href="/" className="nav-link">
          Discover
        </Link>
        <Link href="/dashboard/articles" className="nav-link">
          Articles
        </Link>
        {session.user.role === 'MODERATOR' || session.user.role === 'ADMIN' ? (
          <Link href="/dashboard/moderation" className="nav-link">
            Moderation
          </Link>
        ) : null}
        {session.user.role === 'ADMIN' ? (
          <Link href="/dashboard/admin" className="nav-link">
            Observability
          </Link>
        ) : null}
        <Link href="/dashboard/articles/new" className="nav-link">
          New
        </Link>
        <Link href="/dashboard/notifications" className="nav-link">
          Notifications
        </Link>
        <Link href="/settings/profile" className="nav-link">
          Profile
        </Link>
        <span className="max-w-[12rem] truncate text-xs text-muted lg:max-w-none">{session.user.email}</span>
        <LogoutButton />
      </AppHeader>
      <MainContent className="mx-auto w-full max-w-page flex-1 px-4 py-10 md:px-12 md:py-12">
        {children}
      </MainContent>
      <SiteFooter />
    </div>
  );
}
