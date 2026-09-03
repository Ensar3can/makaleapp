import type { ReactNode } from 'react';
import { BrandMark } from '../brand-mark';
import { HeaderNav } from './header-nav';

export function AppHeader({
  brandHref = '/dashboard',
  search,
  children,
}: {
  brandHref?: string;
  search?: ReactNode;
  children: ReactNode;
}) {
  return (
    <header className="header-bar">
      <div className="header-inner">
        <BrandMark href={brandHref} />
        {search ? <div className="header-search">{search}</div> : null}
        <HeaderNav>{children}</HeaderNav>
      </div>
    </header>
  );
}
