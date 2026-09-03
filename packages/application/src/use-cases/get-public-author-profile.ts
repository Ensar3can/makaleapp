import { ProfileNotFoundError, Slug, type ProfileRepository } from '@aip/domain';
import type { PublicAuthorProfilePage } from '../public-article-views';
import type { UseCase } from '../use-case';
import { SearchArticlesUseCase } from './search-articles';

export interface GetPublicAuthorProfileInput {
  readonly username: string;
  readonly sort?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export class GetPublicAuthorProfileUseCase
  implements UseCase<GetPublicAuthorProfileInput, PublicAuthorProfilePage>
{
  public constructor(
    private readonly profiles: ProfileRepository,
    private readonly search: SearchArticlesUseCase,
  ) {}

  public async execute(input: GetPublicAuthorProfileInput): Promise<PublicAuthorProfilePage> {
    const username = parseUsername(input.username);
    const profile = await this.profiles.findByUsername(username);

    if (!profile) {
      throw new ProfileNotFoundError(input.username);
    }

    const articles = await this.search.execute({
      authorUsername: profile.username.value,
      sort: input.sort,
      cursor: input.cursor,
      limit: input.limit,
    });

    return {
      displayName: profile.displayName,
      username: profile.username.value,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      websiteUrl: profile.websiteUrl,
      articles,
    };
  }
}

function parseUsername(value: string): Slug {
  try {
    return Slug.from(value);
  } catch {
    throw new ProfileNotFoundError(value);
  }
}
