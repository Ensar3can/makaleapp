import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@aip/application';

export class UuidGenerator implements IdGenerator {
  public next(): string {
    return randomUUID();
  }
}
