import {
  InsufficientPermissionError,
  Permission,
  Role,
  UnauthenticatedError,
  User,
  assertAnyRole,
  assertPermission,
} from '@aip/domain';
import type { AuthenticatedIdentity } from './public-identity';

export function requireAuthenticated(identity: AuthenticatedIdentity | null | undefined): AuthenticatedIdentity {
  if (!identity) {
    throw new UnauthenticatedError();
  }

  return identity;
}

export function requirePermission(user: User, permission: Permission): void {
  if (!user.isActive()) {
    throw new UnauthenticatedError();
  }

  assertPermission(user.role, permission);
}

export function requireRole(identity: AuthenticatedIdentity, ...roles: Role[]): AuthenticatedIdentity {
  const resolved = requireAuthenticated(identity);

  try {
    assertAnyRole(resolved.user.role, roles);
  } catch (error) {
    if (error instanceof InsufficientPermissionError) {
      throw error;
    }

    throw new InsufficientPermissionError();
  }

  return resolved;
}

export { Permission, Role };
