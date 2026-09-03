import Link from 'next/link';
import { cx } from '../../lib/cx';

export function SideNav({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  pathname: string;
}) {
  return (
    <nav aria-label={label} className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cx('nav-sidebar-link', active && 'nav-sidebar-link-active')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabNav({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  pathname: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cx('nav-tab', active && 'nav-tab-active')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
