import { Permission, UnauthenticatedError, asUserId, assertPermission, type CategoryRepository, type UserRepository } from '@aip/domain';
import { toPublicCategory, type PublicCategory } from '../article-views';
import type { UseCase } from '../use-case';

export interface ListActiveCategoriesInput {
  readonly actorUserId: string;
}

export class ListActiveCategoriesUseCase implements UseCase<ListActiveCategoriesInput, readonly PublicCategory[]> {
  public constructor(
    private readonly users: UserRepository,
    private readonly categories: CategoryRepository,
  ) {}

  public async execute(input: ListActiveCategoriesInput): Promise<readonly PublicCategory[]> {
    const user = await this.users.findById(asUserId(input.actorUserId));

    if (!user?.isActive()) {
      throw new UnauthenticatedError();
    }

    assertPermission(user.role, Permission.ARTICLE_CREATE);
    const categories = await this.categories.listActive();
    return categories.map(toPublicCategory);
  }
}
