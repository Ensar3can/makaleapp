import type { Profile, User } from '@aip/domain';

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly role: User['role'];
  readonly status: User['status'];
  readonly emailVerified: boolean;
}

export interface PublicProfile {
  readonly displayName: string;
  readonly username: string;
  readonly bio: string;
  readonly avatarUrl: string | null;
  readonly websiteUrl: string | null;
}

export interface AuthenticatedIdentity {
  readonly user: PublicUser;
  readonly profile: PublicProfile | null;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email.value,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

export function toPublicProfile(profile: Profile): PublicProfile {
  return {
    displayName: profile.displayName,
    username: profile.username.value,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    websiteUrl: profile.websiteUrl,
  };
}

export function toAuthenticatedIdentity(user: User, profile: Profile | null): AuthenticatedIdentity {
  return {
    user: toPublicUser(user),
    profile: profile ? toPublicProfile(profile) : null,
  };
}
