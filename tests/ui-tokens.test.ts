import { describe, expect, it } from 'vitest';
import { cx } from '../apps/web/lib/cx';
import {
  ALERT_TONE_CLASS,
  BUTTON_VARIANT_CLASS,
  DIALOG_SURFACE_CLASS,
  HEADER_NAV_DESKTOP_CLASS,
  HEADER_NAV_PANEL_CLASS,
  HEADER_NAV_TOGGLE_CLASS,
} from '../apps/web/components/ui/tokens';

describe('UI primitive tokens', () => {
  it('maps every button variant to a Stitch class', () => {
    expect(BUTTON_VARIANT_CLASS).toEqual({
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      accent: 'btn-accent',
      danger: 'btn-danger',
    });
  });

  it('maps every alert tone to a shared alert class', () => {
    expect(ALERT_TONE_CLASS.error).toBe('alert alert-error');
    expect(ALERT_TONE_CLASS.success).toBe('alert alert-success');
    expect(ALERT_TONE_CLASS.warning).toBe('alert alert-warning');
    expect(ALERT_TONE_CLASS.info).toBe('alert alert-info');
  });

  it('keeps the dialog surface class for native dialogs', () => {
    expect(DIALOG_SURFACE_CLASS).toBe('dialog-surface');
  });

  it('hides primary navigation behind a panel below the 1024px breakpoint', () => {
    expect(HEADER_NAV_DESKTOP_CLASS).toContain('lg:flex');
    expect(HEADER_NAV_TOGGLE_CLASS).toContain('lg:hidden');
    expect(HEADER_NAV_PANEL_CLASS).toBe('header-mobile-panel');
  });

  it('joins class names without empty tokens', () => {
    expect(cx('btn-primary', false, undefined, 'w-full')).toBe('btn-primary w-full');
  });
});
