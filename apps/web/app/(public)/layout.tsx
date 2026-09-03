import type { ReactNode } from 'react';
import { MainContent } from '@/components/main-content';
import { PublicHeader } from '@/components/public-header';
import { SiteFooter } from '@/components/site-footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PublicHeader />
      <MainContent className="flex flex-1 flex-col">{children}</MainContent>
      <SiteFooter />
    </div>
  );
}
