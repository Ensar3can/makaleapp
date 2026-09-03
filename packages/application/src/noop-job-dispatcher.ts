import type { JobDispatcher, JobDispatchOptions } from './ports';

export class NoOpJobDispatcher implements JobDispatcher {
  public async dispatch(
    _name: string,
    _payload: unknown,
    _options?: JobDispatchOptions,
  ): Promise<void> {}
}
