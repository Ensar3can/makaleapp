import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-12">
        <div className="md:col-span-2">
          <p className="font-serif text-lg font-semibold text-navy">Article Intelligence</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Scores come from a persisted snapshot. This interface never calculates them. AI authorship
            is risk, confidence, and a disclaimer — never a binary verdict.
          </p>
        </div>
        <nav aria-label="Discover">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Discover</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/articles" className="nav-link">
                Articles
              </Link>
            </li>
            <li>
              <Link href="/categories" className="nav-link">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/search" className="nav-link">
                Search
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="nav-link">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="nav-link">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
