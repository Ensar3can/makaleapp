import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POST_LOGIN_PATH,
  loginHref,
  registerHref,
  safeInternalPath,
} from '../apps/web/lib/auth/safe-next-path';

describe('safeInternalPath', () => {
  it('keeps in-app destinations used after login', () => {
    expect(safeInternalPath('/dashboard/articles/new')).toBe('/dashboard/articles/new');
    expect(safeInternalPath('/dashboard/moderation?tab=queue')).toBe('/dashboard/moderation?tab=queue');
    expect(safeInternalPath('/articles?sort=published_at')).toBe('/articles?sort=published_at');
    expect(safeInternalPath('/')).toBe('/');
  });

  it('rejects open redirects and auth/api loops', () => {
    expect(safeInternalPath('https://evil.example')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('//evil.example')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('/\\evil.example')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('/login')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('/register?next=/dashboard')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('/api/auth/login')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('/_next/static/chunk.js')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('javascript:alert(1)')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath('')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(safeInternalPath(null)).toBe(DEFAULT_POST_LOGIN_PATH);
  });
});

describe('auth href helpers', () => {
  it('omits next when the destination is the dashboard default', () => {
    expect(loginHref('/dashboard')).toBe('/login');
    expect(loginHref(null)).toBe('/login');
    expect(registerHref('/dashboard')).toBe('/register');
  });

  it('encodes a safe next path on login and register', () => {
    expect(loginHref('/dashboard/articles/new')).toBe(
      '/login?next=%2Fdashboard%2Farticles%2Fnew',
    );
    expect(registerHref('/settings/profile')).toBe('/register?next=%2Fsettings%2Fprofile');
    expect(loginHref('https://evil.example')).toBe('/login');
  });
});
