import { ApplicationError, RateLimitedError, ValidationError } from '@aip/application';
import { DomainError, parseClientIp } from '@aip/domain';
import {
  createLogger,
  getProcessMetrics,
  requestIdHeaderName,
  resolveRequestId,
} from '@aip/logging';
import { NextResponse } from 'next/server';
import { ZodError } from '@aip/validation';

const logger = createLogger({ component: 'http' });
const metrics = getProcessMetrics();
const MAX_JSON_BODY_BYTES = 1_048_576;

export function jsonOk<T>(data: T, init?: { status?: number }): NextResponse {
  return NextResponse.json({ data, error: null, meta: {} }, { status: init?.status ?? 200 });
}

function jsonError(
  code: string,
  message: string,
  status: number,
  meta: Record<string, unknown> = {},
): NextResponse {
  return NextResponse.json({ data: null, error: { code, message }, meta }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');

  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    throw new ValidationError('Request body is too large');
  }

  try {
    return await request.json();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError('Request body must be valid JSON');
  }
}

export function clientIp(request: Request): string {
  return parseClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip'));
}

export async function runApiRoute(
  request: Request,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const started = Date.now();
  const requestId = resolveRequestId(request.headers);
  const path = new URL(request.url).pathname;
  const requestLogger = logger.child({
    requestId,
    method: request.method,
    path,
  });

  try {
    const response = await handler();
    const durationMs = Date.now() - started;
    response.headers.set(requestIdHeaderName(), requestId);
    metrics.observe('http.duration_ms', durationMs, { path });

    if (response.status >= 500) {
      metrics.increment('api_errors', { status: String(response.status) });
      requestLogger.error('request failed', { status: response.status, durationMs });
    } else {
      requestLogger.info('request completed', { status: response.status, durationMs });
    }

    return response;
  } catch (error) {
    const durationMs = Date.now() - started;
    const response = mapError(error);
    response.headers.set(requestIdHeaderName(), requestId);
    metrics.observe('http.duration_ms', durationMs, { path });

    if (response.status >= 500) {
      metrics.increment('api_errors', { status: String(response.status) });
      requestLogger.error('unhandled request error', {
        status: response.status,
        durationMs,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'unknown',
      });
    } else {
      requestLogger.warn('request rejected', { status: response.status, durationMs });
    }

    return response;
  }
}

export function mapError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return jsonError('VALIDATION_ERROR', first?.message ?? 'Request validation failed', 400);
  }

  if (error instanceof RateLimitedError) {
    const response = jsonError(error.code, error.message, 429, { retryAfterMs: error.retryAfterMs });
    response.headers.set('Retry-After', String(Math.ceil(error.retryAfterMs / 1000)));
    return response;
  }

  if (error instanceof DomainError || error instanceof ApplicationError) {
    return jsonError(error.code, error.message, statusFor(error.code));
  }

  logger.error('Unhandled request error', {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'unknown',
  });
  return jsonError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

function statusFor(code: string): number {
  switch (code) {
    case 'INVALID_PASSWORD':
    case 'INVALID_EMAIL':
    case 'INVALID_PROFILE':
    case 'INVALID_SLUG':
    case 'INVALID_ARTICLE_VERSION':
    case 'INVALID_CATEGORY':
    case 'INVALID_TAG':
    case 'VALIDATION_ERROR':
    case 'AUTH_TOKEN_INVALID':
    case 'INVALID_SESSION':
    case 'CATEGORY_NOT_FOUND':
    case 'INVALID_DISCOVERY_CURSOR':
      return 400;
    case 'INVALID_CREDENTIALS':
    case 'UNAUTHENTICATED':
    case 'SESSION_EXPIRED':
      return 401;
    case 'INSUFFICIENT_PERMISSION':
    case 'UNAUTHORIZED_ROLE_ASSIGNMENT':
    case 'UNAUTHORIZED_ARTICLE_ACCESS':
    case 'EMAIL_NOT_VERIFIED':
    case 'INVALID_REQUEST_ORIGIN':
      return 403;
    case 'ARTICLE_NOT_FOUND':
    case 'PROFILE_NOT_FOUND':
    case 'ANALYSIS_JOB_NOT_FOUND':
      return 404;
    case 'EMAIL_ALREADY_REGISTERED':
    case 'USERNAME_TAKEN':
    case 'INVALID_ARTICLE_STATE':
    case 'ARTICLE_ALREADY_PUBLISHED':
    case 'ANALYSIS_NOT_COMPLETED':
      return 409;
    case 'ACCOUNT_LOCKED':
      return 423;
    case 'RATE_LIMITED':
      return 429;
    default:
      return 400;
  }
}
