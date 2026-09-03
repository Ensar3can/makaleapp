import { CLEARED_SESSION_COOKIE, sessionCookieOptions, sessionCookieSecure } from '@aip/auth';
import { getConfig } from '@aip/config';
import { UnauthenticatedError } from '@aip/domain';
import type { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthServices } from './container';
import { loginHref, REQUEST_PATH_HEADER } from './safe-next-path';

export function readSessionToken(cookieHeader: string | null): string | null {
  const name = getConfig().SESSION_COOKIE_NAME;

  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';');

  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');

    if (rawName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

export function attachSessionCookie(response: NextResponse, sessionToken: string): NextResponse {
  const config = getConfig();
  response.cookies.set(config.SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions({
    nodeEnv: config.NODE_ENV,
    maxAgeSeconds: config.SESSION_TTL_SECONDS,
    appUrl: config.APP_URL,
  }));
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  const config = getConfig();
  response.cookies.set(config.SESSION_COOKIE_NAME, '', {
    ...CLEARED_SESSION_COOKIE,
    secure: sessionCookieSecure(config.APP_URL),
  });
  return response;
}

export async function getRequestSession(request: Request) {
  const token = readSessionToken(request.headers.get('cookie'));
  return getAuthServices().resolveSession.execute({ sessionToken: token });
}

export async function requirePageSession() {
  const config = getConfig();
  const store = await cookies();
  const token = store.get(config.SESSION_COOKIE_NAME)?.value;

  try {
    return await getAuthServices().resolveSession.execute({ sessionToken: token });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      const headerStore = await headers();
      redirect(loginHref(headerStore.get(REQUEST_PATH_HEADER)));
    }

    throw error;
  }
}

export async function getOptionalPageSession() {
  const config = getConfig();
  const store = await cookies();
  const token = store.get(config.SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await getAuthServices().resolveSession.execute({ sessionToken: token });
  } catch {
    return null;
  }
}
