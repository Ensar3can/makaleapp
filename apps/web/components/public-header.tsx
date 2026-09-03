import { Suspense } from 'react';
import Link from 'next/link';
import { getOptionalPageSession } from '../lib/auth/session';
import { HeaderSearch, HeaderSearchFallback } from './header-search';
import { AppHeader } from './ui/app-header';
import { ButtonLink } from './ui/button';

export async function PublicHeader() {
  const session = await getOptionalPageSession();

  return (
    <AppHeader
      brandHref="/"
      search={
        <Suspense fallback={<HeaderSearchFallback />}>
          <HeaderSearch />
        </Suspense>
      }
    >
      <Link href="/articles" className="nav-link">
        Articles
      </Link>
      <Link href="/categories" className="nav-link">
        Categories
      </Link>
      {session ? (
        <Link href="/dashboard" className="nav-link text-navy">
          Dashboard
        </Link>
      ) : (
        <>
          <Link href="/login" className="nav-link">
            Sign in
          </Link>
          <ButtonLink href="/register" className="px-4 py-2">
            Create account
          </ButtonLink>
        </>
      )}
    </AppHeader>
  );
}
