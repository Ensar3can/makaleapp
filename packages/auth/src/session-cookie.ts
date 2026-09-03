export interface SessionCookieOptions {
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: 'lax';
  readonly path: '/';
  readonly maxAge: number;
}

export function sessionCookieSecure(appUrl: string): boolean {
  return new URL(appUrl).protocol === 'https:';
}

export function sessionCookieOptions(input: {
  nodeEnv: 'development' | 'test' | 'production';
  maxAgeSeconds: number;
  appUrl?: string;
}): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: input.appUrl ? sessionCookieSecure(input.appUrl) : input.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: input.maxAgeSeconds,
  };
}

export const CLEARED_SESSION_COOKIE = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  path: '/' as const,
  maxAge: 0,
};
