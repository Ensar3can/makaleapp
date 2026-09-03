import Link from 'next/link';

export function BrandMark({
  href = '/',
  tone = 'default',
}: {
  href?: string;
  tone?: 'default' | 'on-dark';
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap font-serif text-lg font-semibold tracking-tight ${
        tone === 'on-dark' ? 'text-white' : 'text-navy'
      }`}
    >
      Article Intelligence
    </Link>
  );
}
