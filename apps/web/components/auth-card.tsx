import type { ReactNode } from 'react';
import { Card } from './ui/card';

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="w-full max-w-[26rem] p-6 shadow-lift sm:p-8">
      <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

export { Field } from './ui/field';
export { FormStatus } from './ui/alert';
export { PrimaryButton, TextLink } from './ui/button';
