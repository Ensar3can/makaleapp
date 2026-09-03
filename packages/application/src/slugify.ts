import { Slug } from '@aip/domain';

const TURKISH: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
};

const MAX_SLUG = 160;

export function slugifyLabel(value: string): string {
  const mapped = [...value].map((character) => TURKISH[character] ?? character).join('');
  return mapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG)
    .replace(/-+$/g, '');
}

export function slugFromLabel(value: string, fallback: string): Slug {
  const slug = slugifyLabel(value);
  return Slug.from(fitSlug(slug.length > 0 ? slug : fallback));
}

function fitSlug(value: string): string {
  const trimmed = value.slice(0, MAX_SLUG).replace(/-+$/g, '');
  return trimmed.length > 0 ? trimmed : 'article';
}
