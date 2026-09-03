import { EmailAddress } from './email-address';
import { Role, UserStatus } from './enums';
import { InvalidUserStateError, UnauthorizedRoleAssignmentError } from './errors';
import type { UserId } from './ids';

export interface UserProps {
  readonly id: UserId;
  readonly email: EmailAddress;
  readonly passwordHash: string;
  readonly role: Role;
  readonly status: UserStatus;
  readonly emailVerifiedAt: Date | null;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class User {
  public readonly id: UserId;
  public readonly email: EmailAddress;
  public readonly passwordHash: string;
  public readonly role: Role;
  public readonly status: UserStatus;
  public readonly emailVerifiedAt: Date | null;
  public readonly lastLoginAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.status = props.status;
    this.emailVerifiedAt = props.emailVerifiedAt;
    this.lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static register(input: {
    id: UserId;
    email: EmailAddress;
    passwordHash: string;
    now: Date;
  }): User {
    if (input.passwordHash.trim().length === 0) {
      throw new InvalidUserStateError('Password hash is required');
    }

    return new User({
      id: input.id,
      email: input.email,
      passwordHash: input.passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public verifyEmail(now: Date): User {
    this.assertNotDeleted();

    if (this.emailVerifiedAt) {
      return this;
    }

    return this.copy({ emailVerifiedAt: now, updatedAt: now });
  }

  public recordLogin(now: Date): User {
    this.assertActive();
    return this.copy({ lastLoginAt: now, updatedAt: now });
  }

  public assignRole(role: Role, actorRole: Role, now: Date): User {
    this.assertNotDeleted();

    if (actorRole !== Role.ADMIN) {
      throw new UnauthorizedRoleAssignmentError();
    }

    return this.copy({ role, updatedAt: now });
  }

  public suspend(now: Date): User {
    this.assertActive();
    return this.copy({ status: UserStatus.SUSPENDED, updatedAt: now });
  }

  public reactivate(now: Date): User {
    this.assertNotDeleted();

    if (this.status !== UserStatus.SUSPENDED) {
      throw new InvalidUserStateError(`Cannot reactivate a user in status ${this.status}`);
    }

    return this.copy({ status: UserStatus.ACTIVE, updatedAt: now });
  }

  public changePasswordHash(passwordHash: string, now: Date): User {
    this.assertActive();

    if (passwordHash.trim().length === 0) {
      throw new InvalidUserStateError('Password hash is required');
    }

    return this.copy({ passwordHash, updatedAt: now });
  }

  public softDelete(now: Date): User {
    this.assertNotDeleted();
    return this.copy({ status: UserStatus.DELETED, updatedAt: now });
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  private assertActive(): void {
    if (this.status !== UserStatus.ACTIVE) {
      throw new InvalidUserStateError(`User is not active (status ${this.status})`);
    }
  }

  private assertNotDeleted(): void {
    if (this.status === UserStatus.DELETED) {
      throw new InvalidUserStateError('Deleted users cannot change state');
    }
  }

  private copy(patch: Partial<UserProps>): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      status: this.status,
      emailVerifiedAt: this.emailVerifiedAt,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...patch,
    });
  }
}
