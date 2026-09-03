import { getAuthServices } from '../../../../lib/auth/container';
import { clearSessionCookie, readSessionToken } from '../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    await getAuthServices().logoutUser.execute({
      sessionToken: readSessionToken(request.headers.get('cookie')),
    });
    return clearSessionCookie(jsonOk({ ok: true }));
  } catch (error) {
    return mapError(error);
  }
}
