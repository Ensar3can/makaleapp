import { ButtonLink } from './button';

export function Pagination({
  href,
  label = 'Load more',
}: {
  href: string | null | undefined;
  label?: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <nav aria-label="Pagination">
      <ButtonLink href={href} variant="secondary">
        {label}
      </ButtonLink>
    </nav>
  );
}
