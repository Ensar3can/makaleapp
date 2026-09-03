import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cx } from '../../lib/cx';

function FieldFrame({
  label,
  hint,
  compact = false,
  children,
}: {
  label: string;
  hint?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={compact ? 'filter-label' : 'field-label'}>{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  hint,
  compact,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  compact?: boolean;
}) {
  return (
    <FieldFrame label={label} hint={hint} compact={compact}>
      <input className={cx('field-input', className)} {...props} />
    </FieldFrame>
  );
}

export function TextareaField({
  label,
  hint,
  compact,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
  compact?: boolean;
}) {
  return (
    <FieldFrame label={label} hint={hint} compact={compact}>
      <textarea className={cx('field-input', className)} {...props} />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  hint,
  compact,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <FieldFrame label={label} hint={hint} compact={compact}>
      <select className={cx('field-input', className)} {...props}>
        {children}
      </select>
    </FieldFrame>
  );
}

export function CheckboxField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="choice-row">
      <input type="checkbox" className={className} {...props} />
      <span>{label}</span>
    </label>
  );
}

export function RadioField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="choice-row">
      <input type="radio" className={className} {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <TextField
      label={label}
      name={name}
      type={type}
      autoComplete={autoComplete}
      required={required}
      minLength={minLength}
    />
  );
}
