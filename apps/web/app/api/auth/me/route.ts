import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../lib/http';

export async function GET(request: Request) {
  try {
    const identity = await getRequestSession(request);
    return jsonOk({ user: identity.user, profile: identity.profile });
  } catch (error) {
    return mapError(error);
  }
}
