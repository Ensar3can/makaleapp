import { InvalidProfileError } from './errors';
import type { ProfileId, UserId } from './ids';
import { assertPublicHttpsUrl } from './public-https-url';
import { Slug } from './slug';

const DISPLAY_NAME_MAX = 80;
const BIO_MAX = 500;

export interface ProfileProps {
  readonly id: ProfileId;
  readonly userId: UserId;
  readonly displayName: string;
  readonly username: Slug;
  readonly bio: string;
  readonly avatarUrl: string | null;
  readonly websiteUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Profile {
  public readonly id: ProfileId;
  public readonly userId: UserId;
  public readonly displayName: string;
  public readonly username: Slug;
  public readonly bio: string;
  public readonly avatarUrl: string | null;
  public readonly websiteUrl: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: ProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.displayName = props.displayName;
    this.username = props.username;
    this.bio = props.bio;
    this.avatarUrl = props.avatarUrl;
    this.websiteUrl = props.websiteUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: {
    id: ProfileId;
    userId: UserId;
    displayName: string;
    username: Slug;
    bio?: string;
    avatarUrl?: string | null;
    websiteUrl?: string | null;
    now: Date;
  }): Profile {
    return new Profile({
      id: input.id,
      userId: input.userId,
      displayName: assertDisplayName(input.displayName),
      username: input.username,
      bio: assertBio(input.bio ?? ''),
      avatarUrl: assertPublicHttpsUrl(input.avatarUrl ?? null, 'Avatar URL'),
      websiteUrl: assertPublicHttpsUrl(input.websiteUrl ?? null, 'Website URL'),
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static reconstitute(props: ProfileProps): Profile {
    return new Profile(props);
  }

  public update(input: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string | null;
    websiteUrl?: string | null;
    now: Date;
  }): Profile {
    return new Profile({
      id: this.id,
      userId: this.userId,
      displayName:
        input.displayName === undefined ? this.displayName : assertDisplayName(input.displayName),
      username: this.username,
      bio: input.bio === undefined ? this.bio : assertBio(input.bio),
      avatarUrl:
        input.avatarUrl === undefined
          ? this.avatarUrl
          : assertPublicHttpsUrl(input.avatarUrl, 'Avatar URL'),
      websiteUrl:
        input.websiteUrl === undefined
          ? this.websiteUrl
          : assertPublicHttpsUrl(input.websiteUrl, 'Website URL'),
      createdAt: this.createdAt,
      updatedAt: input.now,
    });
  }
}

function assertDisplayName(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > DISPLAY_NAME_MAX) {
    throw new InvalidProfileError(`Display name must be between 1 and ${DISPLAY_NAME_MAX} characters`);
  }

  return trimmed;
}

function assertBio(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length > BIO_MAX) {
    throw new InvalidProfileError(`Bio must be at most ${BIO_MAX} characters`);
  }

  return trimmed;
}

