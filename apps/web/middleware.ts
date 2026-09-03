import { buildSecurityHeaders, cacheControlForRequest, checkMutatingRequestOrigin } from '@aip/domain';
import { requestIdHeaderName, resolveRequestId } from '@aip/logging/request-id';
import { NextResponse, type NextRequest } from 'next/server';
import { REQUEST_PATH_HEADER } from './lib/auth/safe-next-path';

export function middleware(request: NextRequest) {
  const production = process.env.NODE_ENV === 'production';
  const allowedOrigin = process.env.APP_URL ?? 'http://localhost:3000';
  const originCheck = checkMutatingRequestOrigin({
    method: request.method,
    originHeader: request.headers.get('origin'),
    refererHeader: request.headers.get('referer'),
    allowedOrigins: [allowedOrigin],
  });

  if (!originCheck.allowed) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INVALID_REQUEST_ORIGIN', message: 'Request origin is not allowed' },
        meta: {},
      },
      { status: 403, headers: buildSecurityHeaders({ production }) },
    );
  }

  const requestId = resolveRequestId(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(requestIdHeaderName(), requestId);
  requestHeaders.set(REQUEST_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(requestIdHeaderName(), requestId);

  for (const [name, value] of Object.entries(buildSecurityHeaders({ production }))) {
    response.headers.set(name, value);
  }

  const cacheControl = cacheControlForRequest({
    method: request.method,
    pathname: request.nextUrl.pathname,
  });

  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
