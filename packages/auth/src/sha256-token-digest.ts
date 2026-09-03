import { createHash } from 'node:crypto';
import type { TokenDigest } from '@aip/application';

export class Sha256TokenDigest implements TokenDigest {
  public constructor(private readonly pepper = '') {}

  public hash(token: string): string {
    return createHash('sha256').update(`${this.pepper}${token}`, 'utf8').digest('hex');
  }
}
