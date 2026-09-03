export const BUTTON_VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
  danger: 'btn-danger',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS;

export const ALERT_TONE_CLASS = {
  error: 'alert alert-error',
  success: 'alert alert-success',
  warning: 'alert alert-warning',
  info: 'alert alert-info',
} as const;

export type AlertTone = keyof typeof ALERT_TONE_CLASS;

export const DIALOG_SURFACE_CLASS = 'dialog-surface';

/** Desktop navigation appears at Tailwind `lg` (1024px). Below that, HeaderNav opens a panel. */
export const HEADER_NAV_DESKTOP_CLASS = 'hidden items-center gap-6 text-sm lg:flex lg:gap-10';
export const HEADER_NAV_TOGGLE_CLASS = 'lg:hidden';
export const HEADER_NAV_OVERLAY_CLASS = 'fixed inset-0 z-30 bg-ink/40 lg:hidden';
export const HEADER_NAV_PANEL_CLASS = 'header-mobile-panel';
