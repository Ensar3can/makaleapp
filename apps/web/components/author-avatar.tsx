import { isSafePublicHref } from '@aip/domain';

export function AuthorAvatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const safeSrc = src && isSafePublicHref(src) ? src : null;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline bg-mist text-[11px] font-semibold text-navy"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {safeSrc ? (
        <img
          src={safeSrc}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
