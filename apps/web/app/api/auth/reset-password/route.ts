import { resetPasswordBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../../lib/auth/container';
import { clientIp, jsonOk, mapError, readJson } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const body = resetPasswordBodySchema.parse(await readJson(request));
    await getAuthServices().resetPassword.execute({
      ...body,
      clientIp: clientIp(request),
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return mapError(error);
  }
}
