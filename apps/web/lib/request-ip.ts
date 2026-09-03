import { parseClientIp } from '@aip/domain';
import { headers } from 'next/headers';

export async function requestClientIp(): Promise<string> {
  const incoming = await headers();
  return parseClientIp(incoming.get('x-forwarded-for'), incoming.get('x-real-ip'));
}
