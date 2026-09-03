import { randomBytes } from 'node:crypto';
import type { TokenGenerator } from '@aip/application';

export class RandomTokenGenerator implements TokenGenerator {
  public next(): string {
    return randomBytes(32).toString('base64url');
  }
}
