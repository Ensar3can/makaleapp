export class ApplicationError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitedError extends ApplicationError {
  public constructor(public readonly retryAfterMs: number) {
    super('RATE_LIMITED', 'Too many requests. Try again later.');
  }
}

export class ValidationError extends ApplicationError {
  public constructor(message: string) {
    super('VALIDATION_ERROR', message);
  }
}
