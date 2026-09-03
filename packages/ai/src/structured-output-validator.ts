import { ZodError } from '@aip/validation';
import { StructuredOutputError } from './errors';
import type { StructuredParseable } from './types';

export class StructuredOutputValidator {
  public validate<T>(value: unknown, schema: StructuredParseable<T>): T {
    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new StructuredOutputError('AI output did not match the required schema');
      }

      throw error;
    }
  }
}
