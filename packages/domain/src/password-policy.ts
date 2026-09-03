import { InvalidPasswordError } from './errors';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

export function assertPassword(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new InvalidPasswordError(
      `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    );
  }

  if (!HAS_LETTER.test(password) || !HAS_DIGIT.test(password)) {
    throw new InvalidPasswordError('Password must include at least one letter and one number');
  }

  return password;
}
