import { loginBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../../lib/auth/container';
import { attachSessionCookie } from '../../../../lib/auth/session';
import { clientIp, jsonOk, mapError, readJson } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const body = loginBodySchema.parse(await readJson(request));
    const auth = getAuthServices();
    const result = await auth.loginUser.execute({
      ...body,
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
      sessionTtlSeconds: auth.config.SESSION_TTL_SECONDS,
    });
    return attachSessionCookie(
      jsonOk({
        user: result.user,
        profile: result.profile,
      }),
      result.sessionToken,
    );
  } catch (error) {
    return mapError(error);
  }
}
