import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

describe('loadConfig', () => {
  it('applies defaults and detects the memory redis driver', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      REDIS_URL: 'memory://local',
    });

    expect(config.NODE_ENV).toBe('test');
    expect(config.redisDriver).toBe('memory');
    expect(config.OBJECT_STORAGE_DRIVER).toBe('local-disk');
    expect(config.MAX_ARTICLE_WORDS).toBe(20_000);
    expect(config.SESSION_COOKIE_NAME).toBe('aip_session');
    expect(config.SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
    expect(config.AI_PROVIDER).toBe('fake');
    expect(config.AI_MODEL).toBe('gpt-4o-mini');
  });

  it('rejects an invalid APP_URL', () => {
    expect(() =>
      loadConfig({
        APP_URL: 'not-a-url',
      }),
    ).toThrow();
  });

  it('detects a real redis driver from REDIS_URL', () => {
    const config = loadConfig({
      REDIS_URL: 'redis://127.0.0.1:6379',
    });

    expect(config.redisDriver).toBe('redis');
  });

  it('requires a session pepper in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: '',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }),
    ).toThrow(/SESSION_PEPPER/);

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }).SESSION_PEPPER,
    ).toBe('production-pepper-ok');

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: '',
        NEXT_PHASE: 'phase-production-build',
      }).SESSION_PEPPER,
    ).toBe('');
  });

  it('requires an API key when the OpenAI provider is selected', () => {
    expect(() =>
      loadConfig({
        AI_PROVIDER: 'openai',
        AI_API_KEY: '',
      }),
    ).toThrow(/AI_API_KEY/);
  });

  it('requires S3 credentials when the S3 storage driver is selected', () => {
    expect(() =>
      loadConfig({
        OBJECT_STORAGE_DRIVER: 's3',
        OBJECT_STORAGE_ACCESS_KEY: '',
        OBJECT_STORAGE_SECRET_KEY: '',
      }),
    ).toThrow(/OBJECT_STORAGE_ACCESS_KEY/);

    const config = loadConfig({
      OBJECT_STORAGE_DRIVER: 's3',
      OBJECT_STORAGE_ACCESS_KEY: 'minio',
      OBJECT_STORAGE_SECRET_KEY: 'minio-secret',
      OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
      OBJECT_STORAGE_BUCKET: 'aip',
    });

    expect(config.OBJECT_STORAGE_DRIVER).toBe('s3');
    expect(config.OBJECT_STORAGE_BUCKET).toBe('aip');
    expect(config.objectStorageForcePathStyle).toBe(true);
  });

  it('requires a real Redis URL in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'memory://local',
      }),
    ).toThrow(/REDIS_URL/);

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }).redisDriver,
    ).toBe('redis');

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: '',
        REDIS_URL: 'memory://local',
        NEXT_PHASE: 'phase-production-build',
      }).redisDriver,
    ).toBe('memory');
  });

  it('requires https APP_URL in production except loopback', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'redis://127.0.0.1:6379',
        APP_URL: 'http://articles.example',
      }),
    ).toThrow(/https/);

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'redis://127.0.0.1:6379',
        APP_URL: 'http://localhost:3000',
      }).APP_URL,
    ).toBe('http://localhost:3000');

    expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_PEPPER: 'production-pepper-ok',
        REDIS_URL: 'redis://127.0.0.1:6379',
        APP_URL: 'https://articles.example',
      }).APP_URL,
    ).toBe('https://articles.example');
  });
});
