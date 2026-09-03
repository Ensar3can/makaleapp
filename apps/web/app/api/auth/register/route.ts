import { registerBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../../lib/auth/container';
import { clientIp, jsonOk, mapError, readJson } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const body = registerBodySchema.parse(await readJson(request));
    const identity = await getAuthServices().registerUser.execute({
      ...body,
      ip: clientIp(request),
      appOrigin: getAuthServices().config.APP_URL,
    });
    return jsonOk(identity, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
