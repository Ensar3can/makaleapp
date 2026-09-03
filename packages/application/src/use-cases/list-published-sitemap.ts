import {
  PUBLIC_DISCOVERY_LIMITS,
  type PublicArticleDiscoveryRepository,
  type PublicSitemapEntry,
} from '@aip/domain';
import type { UseCase } from '../use-case';

export interface ListPublishedSitemapInput {
  readonly limit?: number;
}

export class ListPublishedSitemapUseCase
  implements UseCase<ListPublishedSitemapInput, readonly PublicSitemapEntry[]>
{
  public constructor(private readonly discovery: PublicArticleDiscoveryRepository) {}

  public async execute(
    input: ListPublishedSitemapInput = {},
  ): Promise<readonly PublicSitemapEntry[]> {
    const limit =
      input.limit === undefined
        ? PUBLIC_DISCOVERY_LIMITS.sitemapSize
        : Math.min(PUBLIC_DISCOVERY_LIMITS.sitemapSize, Math.max(1, input.limit));

    return this.discovery.listPublishedIndex(limit);
  }
}
