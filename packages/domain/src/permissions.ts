import { Role, Permission } from './enums';
import { InsufficientPermissionError } from './errors';

const ALL_PERMISSIONS: readonly Permission[] = Object.values(Permission);

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.USER]: [Permission.PROFILE_READ_OWN, Permission.PROFILE_UPDATE_OWN, Permission.ARTICLE_CREATE],
  [Role.MODERATOR]: [
    Permission.PROFILE_READ_OWN,
    Permission.PROFILE_UPDATE_OWN,
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_MODERATE,
    Permission.ANALYSIS_INSPECT,
  ],
  [Role.ADMIN]: ALL_PERMISSIONS,
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new InsufficientPermissionError();
  }
}

export function assertAnyRole(role: Role, allowed: readonly Role[]): void {
  if (!allowed.includes(role)) {
    throw new InsufficientPermissionError();
  }
}
