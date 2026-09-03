import { createHash } from 'node:crypto';
import { ContentHash } from '@aip/domain';

export function hashArticlePayload(input: {
  title: string;
  abstract: string;
  content: string;
}): ContentHash {
  const digest = createHash('sha256')
    .update(input.title.trim(), 'utf8')
    .update('\n')
    .update(input.abstract.trim(), 'utf8')
    .update('\n')
    .update(input.content, 'utf8')
    .digest('hex');

  return ContentHash.from(digest);
}
