import { InvalidCategoryError } from './errors';
import type { CategoryId } from './ids';
import { Slug } from './slug';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 400;

export interface CategoryProps {
  readonly id: CategoryId;
  readonly name: string;
  readonly slug: Slug;
  readonly description: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Category {
  public readonly id: CategoryId;
  public readonly name: string;
  public readonly slug: Slug;
  public readonly description: string;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: CategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: {
    id: CategoryId;
    name: string;
    slug: Slug;
    description?: string;
    now: Date;
  }): Category {
    return new Category({
      id: input.id,
      name: assertName(input.name),
      slug: input.slug,
      description: assertDescription(input.description ?? ''),
      isActive: true,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  public rename(input: { name: string; slug: Slug; now: Date }): Category {
    return this.copy({
      name: assertName(input.name),
      slug: input.slug,
      updatedAt: input.now,
    });
  }

  public deactivate(now: Date): Category {
    return this.copy({ isActive: false, updatedAt: now });
  }

  public activate(now: Date): Category {
    return this.copy({ isActive: true, updatedAt: now });
  }

  private copy(patch: Partial<CategoryProps>): Category {
    return new Category({
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...patch,
    });
  }
}

function assertName(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > NAME_MAX) {
    throw new InvalidCategoryError(`Category name must be between 1 and ${NAME_MAX} characters`);
  }

  return trimmed;
}

function assertDescription(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length > DESCRIPTION_MAX) {
    throw new InvalidCategoryError(`Category description must be at most ${DESCRIPTION_MAX} characters`);
  }

  return trimmed;
}
