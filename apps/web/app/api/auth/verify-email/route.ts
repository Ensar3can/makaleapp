import { tokenBodySchema } from '@aip/validation';
import { getAuthServices } from '../../../../lib/auth/container';
import { jsonOk, mapError, readJson } from '../../../../lib/http';

export async function POST(request: Request) {
  try {
    const body = tokenBodySchema.parse(await readJson(request));
    const user = await getAuthServices().verifyEmail.execute(body);
    return jsonOk({ user });
  } catch (error) {
    return mapError(error);
  }
}
