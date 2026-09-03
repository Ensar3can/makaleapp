import { PromptNotFoundError } from './errors';
import { FOUNDATION_PROMPTS } from './prompts';
import type { PromptDefinition, PromptRegistry } from './types';

export class InMemoryPromptRegistry implements PromptRegistry {
  private readonly prompts = new Map<string, PromptDefinition>();

  public constructor(prompts: readonly PromptDefinition[] = FOUNDATION_PROMPTS) {
    for (const prompt of prompts) {
      this.register(prompt);
    }
  }

  public register(prompt: PromptDefinition): void {
    this.prompts.set(prompt.id, prompt);
  }

  public get(id: string): PromptDefinition {
    const prompt = this.prompts.get(id);

    if (!prompt) {
      throw new PromptNotFoundError(id);
    }

    return prompt;
  }

  public list(): readonly PromptDefinition[] {
    return [...this.prompts.values()];
  }
}

export function createFoundationPromptRegistry(): InMemoryPromptRegistry {
  return new InMemoryPromptRegistry(FOUNDATION_PROMPTS);
}
