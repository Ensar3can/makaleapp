import { NoOpJobDispatcher, type JobDispatcher } from '@aip/application';

let cached: JobDispatcher | undefined;

export function getJobDispatcher(): JobDispatcher {
  cached ??= new NoOpJobDispatcher();
  return cached;
}
