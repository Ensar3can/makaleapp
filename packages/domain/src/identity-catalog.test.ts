import { describe, expect, it } from 'vitest';
import { Category } from './category';
import { EmailAddress } from './email-address';
import { Role, UserStatus } from './enums';
import {
  InvalidCategoryError,
  InvalidEmailError,
  InvalidProfileError,
  InvalidSlugError,
  InvalidUserStateError,
  UnauthorizedRoleAssignmentError,
} from './errors';
import { asCategoryId, asProfileId, asTagId, asUserId } from './ids';
import { Profile } from './profile';
import { Slug } from './slug';
import { Tag } from './tag';
import { User } from './user';

const NOW = new Date('2026-08-29T08:00:00.000Z');
const LATER = new Date('2026-08-29T09:00:00.000Z');

describe('User', () => {
  it('registers as an active user and supports the account lifecycle', () => {
    const user = User.register({
      id: asUserId('user-1'),
      email: EmailAddress.from('Author@Example.com'),
      passwordHash: 'hashed-secret',
      now: NOW,
    });

    expect(user.email.value).toBe('author@example.com');
    expect(user.role).toBe(Role.USER);
    expect(user.status).toBe(UserStatus.ACTIVE);

    const verified = user.verifyEmail(LATER);
    expect(verified.emailVerifiedAt).toEqual(LATER);
    expect(verified.verifyEmail(LATER).emailVerifiedAt).toEqual(LATER);

    const loggedIn = verified.recordLogin(LATER);
    expect(loggedIn.lastLoginAt).toEqual(LATER);

    const suspended = loggedIn.suspend(LATER);
    expect(suspended.status).toBe(UserStatus.SUSPENDED);
    expect(() => suspended.recordLogin(LATER)).toThrow(InvalidUserStateError);

    const reactivated = suspended.reactivate(LATER);
    expect(reactivated.status).toBe(UserStatus.ACTIVE);
  });

  it('allows only administrators to assign roles', () => {
    const user = User.register({
      id: asUserId('user-2'),
      email: EmailAddress.from('mod@example.com'),
      passwordHash: 'hashed-secret',
      now: NOW,
    });

    expect(() => user.assignRole(Role.MODERATOR, Role.USER, LATER)).toThrow(
      UnauthorizedRoleAssignmentError,
    );

    const promoted = user.assignRole(Role.MODERATOR, Role.ADMIN, LATER);
    expect(promoted.role).toBe(Role.MODERATOR);

    const rotated = promoted.changePasswordHash('rotated-hash', LATER);
    expect(rotated.passwordHash).toBe('rotated-hash');
  });

  it('treats soft-delete as terminal', () => {
    const deleted = User.register({
      id: asUserId('user-3'),
      email: EmailAddress.from('gone@example.com'),
      passwordHash: 'hashed-secret',
      now: NOW,
    }).softDelete(LATER);

    expect(deleted.status).toBe(UserStatus.DELETED);
    expect(() => deleted.suspend(LATER)).toThrow(InvalidUserStateError);
  });
});

describe('Profile, Category, Tag, and value objects', () => {
  it('creates and updates a profile', () => {
    const profile = Profile.create({
      id: asProfileId('profile-1'),
      userId: asUserId('user-1'),
      displayName: 'Ensar',
      username: Slug.from('ensar'),
      now: NOW,
    });

    const updated = profile.update({
      bio: 'Writes about evaluation systems.',
      websiteUrl: 'https://example.com',
      now: LATER,
    });

    expect(updated.displayName).toBe('Ensar');
    expect(updated.username.value).toBe('ensar');
    expect(updated.websiteUrl).toBe('https://example.com');
    expect(() =>
      profile.update({ websiteUrl: 'ftp://example.com', now: LATER }),
    ).toThrow(InvalidProfileError);
    expect(() =>
      profile.update({ websiteUrl: 'http://example.com', now: LATER }),
    ).toThrow(InvalidProfileError);
    expect(() =>
      profile.update({ websiteUrl: 'javascript:alert(1)', now: LATER }),
    ).toThrow(InvalidProfileError);
  });

  it('activates and deactivates categories', () => {
    const category = Category.create({
      id: asCategoryId('cat-1'),
      name: 'Science',
      slug: Slug.from('science'),
      description: 'Research explainers',
      now: NOW,
    });

    expect(category.isActive).toBe(true);

    const inactive = category.deactivate(LATER);
    expect(inactive.isActive).toBe(false);
    expect(inactive.activate(LATER).isActive).toBe(true);
    expect(() =>
      Category.create({
        id: asCategoryId('cat-2'),
        name: '',
        slug: Slug.from('empty'),
        now: NOW,
      }),
    ).toThrow(InvalidCategoryError);
  });

  it('creates tags and validates slugs and emails', () => {
    const tag = Tag.create({
      id: asTagId('tag-1'),
      name: 'evaluation',
      slug: Slug.from('evaluation'),
      now: NOW,
    });

    expect(tag.slug.value).toBe('evaluation');
    expect(() => Slug.from('Not A Slug')).toThrow(InvalidSlugError);
    expect(() => EmailAddress.from('not-an-email')).toThrow(InvalidEmailError);
  });
});
