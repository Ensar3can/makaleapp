import type { ReactNode } from 'react';
import { BrandMark } from '../../components/brand-mark';
import { MainContent } from '../../components/main-content';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white md:flex md:w-1/2 md:flex-col md:justify-between">
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <BrandMark tone="on-dark" />
        <div className="relative z-10 max-w-md">
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Transparent evaluation for published research.
          </h1>
          <p className="mt-6 text-base leading-7 text-navy-muted">
            Scores are read from a persisted snapshot. AI authorship is shown as risk and confidence,
            never as a binary verdict.
          </p>
        </div>
        <p className="relative z-10 text-xs text-navy-muted">Article Intelligence · snapshot scores only</p>
      </aside>
      <section className="flex flex-1 flex-col">
        <header className="border-b border-line bg-white p-4 md:hidden">
          <BrandMark />
        </header>
        <MainContent className="flex flex-1 items-center justify-center px-4 py-12">{children}</MainContent>
      </section>
    </div>
  );
}
