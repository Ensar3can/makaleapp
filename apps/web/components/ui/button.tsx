import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { cx } from '../../lib/cx';
import { BUTTON_VARIANT_CLASS, type ButtonVariant } from './tokens';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    pending?: boolean;
    pendingLabel?: string;
    children: ReactNode;
  }
>(function Button(
  {
    variant = 'primary',
    pending = false,
    pendingLabel = 'Please wait…',
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(BUTTON_VARIANT_CLASS[variant], className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(BUTTON_VARIANT_CLASS[variant], className)}>
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cx('link-accent text-sm', className)}>
      {children}
    </Link>
  );
}

export function PrimaryButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending: boolean;
}) {
  return (
    <Button type="submit" variant="primary" pending={pending} className="w-full">
      {children}
    </Button>
  );
}
