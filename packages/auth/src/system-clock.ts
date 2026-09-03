import type { Clock } from '@aip/application';

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }
}
