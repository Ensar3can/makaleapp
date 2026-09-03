import { getAuthServices } from '../../../../lib/auth/container';
import { getRequestSession } from '../../../../lib/auth/session';
import { jsonOk, mapError } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);
    await getAuthServices().requestEmailVerification.execute({
      userId: session.userId,
      appOrigin: getAuthServices().config.APP_URL,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return mapError(error);
  }
}
