import { Role } from '@aip/domain';
import { redirect } from 'next/navigation';
import { requirePageSession } from './session';

export async function requireModeratorPage() {
  const session = await requirePageSession();

  if (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return session;
}
