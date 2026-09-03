import { InvalidTagError } from './errors';
import type { TagId } from './ids';
import { Slug } from './slug';

const NAME_MAX = 40;

export interface TagProps {
  readonly id: TagId;
  readonly name: string;
  readonly slug: Slug;
  readonly createdAt: Date;
}

export class Tag {
  public readonly id: TagId;
  public readonly name: string;
  public readonly slug: Slug;
  public readonly createdAt: Date;

  private constructor(props: TagProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.createdAt = props.createdAt;
  }

  public static create(input: { id: TagId; name: string; slug: Slug; now: Date }): Tag {
    return new Tag({
      id: input.id,
      name: assertName(input.name),
      slug: input.slug,
      createdAt: input.now,
    });
  }

  public static reconstitute(props: TagProps): Tag {
    return new Tag(props);
  }
}

function assertName(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > NAME_MAX) {
    throw new InvalidTagError(`Tag name must be between 1 and ${NAME_MAX} characters`);
  }

  return trimmed;
}
