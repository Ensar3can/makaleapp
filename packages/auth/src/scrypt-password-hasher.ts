import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHasher } from '@aip/application';

const COST_N = 16_384;
const BLOCK_SIZE_R = 8;
const PARALLEL_P = 1;
const KEY_LENGTH = 64;
const SCHEME = 'scrypt';

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(asBuffer(derived));
    });
  });
}

export class ScryptPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await scryptAsync(password, salt, KEY_LENGTH, {
      N: COST_N,
      r: BLOCK_SIZE_R,
      p: PARALLEL_P,
    });

    return [
      SCHEME,
      String(COST_N),
      String(BLOCK_SIZE_R),
      String(PARALLEL_P),
      salt.toString('base64url'),
      derived.toString('base64url'),
    ].join('$');
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    const parts = passwordHash.split('$');

    if (parts.length !== 6 || parts[0] !== SCHEME) {
      return false;
    }

    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const saltPart = parts[4];
    const hashPart = parts[5];

    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || !saltPart || !hashPart) {
      return false;
    }

    const salt = Buffer.from(saltPart, 'base64url');
    const expected = Buffer.from(hashPart, 'base64url');

    if (salt.length === 0 || expected.length === 0) {
      return false;
    }

    const derived = await scryptAsync(password, salt, expected.length, { N: n, r, p });

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  }
}

function asBuffer(value: unknown): Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new Error('scrypt did not return a buffer');
  }

  return value;
}
