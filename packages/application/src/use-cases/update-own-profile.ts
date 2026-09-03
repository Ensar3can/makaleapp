import {
  Permission,
  UnauthenticatedError,
  asUserId,
  assertPermission,
  type ProfileRepository,
  type UserRepository,
} from '@aip/domain';
import { toPublicProfile, type PublicProfile } from '../public-identity';
import type { Clock } from '../ports';
import type { UseCase } from '../use-case';

export interface UpdateOwnProfileInput {
  readonly actorUserId: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly avatarUrl?: string | null;
  readonly websiteUrl?: string | null;
}

export class UpdateOwnProfileUseCase implements UseCase<UpdateOwnProfileInput, PublicProfile> {
  public constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(input: UpdateOwnProfileInput): Promise<PublicProfile> {
    const user = await this.users.findById(asUserId(input.actorUserId));

    if (!user?.isActive()) {
      throw new UnauthenticatedError();
    }

    assertPermission(user.role, Permission.PROFILE_UPDATE_OWN);

    const profile = await this.profiles.findByUserId(user.id);

    if (!profile) {
      throw new UnauthenticatedError();
    }

    const updated = profile.update({
      displayName: input.displayName,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      websiteUrl: input.websiteUrl,
      now: this.clock.now(),
    });
    await this.profiles.save(updated);
    return toPublicProfile(updated);
  }
}
