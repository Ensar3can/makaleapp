export class PromptNotFoundError extends Error {
  public constructor(promptId: string) {
    super(`Prompt is not registered: ${promptId}`);
    this.name = new.target.name;
  }
}

export class StructuredOutputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AIProviderError extends Error {
  public readonly retryable: boolean;

  public constructor(message: string, retryable: boolean) {
    super(message);
    this.name = new.target.name;
    this.retryable = retryable;
  }
}
