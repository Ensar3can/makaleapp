import { forgotPasswordBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../../lib/auth/container';
import { clientIp, jsonOk, mapError, readJson } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const body = forgotPasswordBodySchema.parse(await readJson(request));
    await getAuthServices().requestPasswordReset.execute({
      email: body.email,
      ip: clientIp(request),
      appOrigin: getAuthServices().config.APP_URL,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return mapError(error);
  }
}
