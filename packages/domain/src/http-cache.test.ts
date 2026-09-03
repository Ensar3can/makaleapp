import { describe, expect, it } from 'vitest';
import { PUBLIC_HTTP_CACHE_CONTROL, cacheControlForRequest, isPublicCacheablePath } from './http-cache';

describe('public HTTP cache policy', () => {
  it('marks public discovery pages cacheable', () => {
    expect(isPublicCacheablePath('/')).toBe(true);
    expect(isPublicCacheablePath('/articles')).toBe(true);
    expect(isPublicCacheablePath('/articles/high-score-discovery')).toBe(true);
    expect(isPublicCacheablePath('/categories/computer-science')).toBe(true);
    expect(isPublicCacheablePath('/profile/ada-author')).toBe(true);
    expect(isPublicCacheablePath('/search')).toBe(true);
  });

  it('does not cache personalized or mutating surfaces', () => {
    expect(isPublicCacheablePath('/dashboard')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/admin')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/admin/analysis')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/admin/categories')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/admin/users')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/articles/article-1/analysis')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/notifications')).toBe(false);
    expect(isPublicCacheablePath('/settings/account')).toBe(false);
    expect(isPublicCacheablePath('/admin')).toBe(false);
    expect(isPublicCacheablePath('/api/admin/observability')).toBe(false);
    expect(isPublicCacheablePath('/dashboard/articles')).toBe(false);
    expect(isPublicCacheablePath('/api/articles')).toBe(false);
    expect(isPublicCacheablePath('/login')).toBe(false);
    expect(isPublicCacheablePath('/settings/profile')).toBe(false);
    expect(cacheControlForRequest({ method: 'POST', pathname: '/articles' })).toBeNull();
  });

  it('emits a shared short-lived Cache-Control for public GET', () => {
    expect(cacheControlForRequest({ method: 'GET', pathname: '/' })).toBe(PUBLIC_HTTP_CACHE_CONTROL);
    expect(cacheControlForRequest({ method: 'HEAD', pathname: '/articles' })).toBe(
      PUBLIC_HTTP_CACHE_CONTROL,
    );
  });
});
