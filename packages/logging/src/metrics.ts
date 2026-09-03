export interface MetricFields {
  readonly [key: string]: string;
}

export interface MetricCounter {
  readonly name: string;
  readonly fields: MetricFields;
  readonly value: number;
}

export interface MetricObservation {
  readonly name: string;
  readonly fields: MetricFields;
  readonly count: number;
  readonly total: number;
}

export interface MetricsSnapshot {
  readonly counters: readonly MetricCounter[];
  readonly observations: readonly MetricObservation[];
}

export interface MetricsRecorder {
  increment(name: string, fields?: MetricFields): void;
  observe(name: string, value: number, fields?: MetricFields): void;
  snapshot(): MetricsSnapshot;
}

function fieldKey(fields: MetricFields = {}): string {
  return Object.entries(fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export class InMemoryMetricsRecorder implements MetricsRecorder {
  private readonly counters = new Map<string, MetricCounter>();
  private readonly observations = new Map<string, MetricObservation>();

  public increment(name: string, fields: MetricFields = {}): void {
    const key = `${name}|${fieldKey(fields)}`;
    const current = this.counters.get(key);
    this.counters.set(key, {
      name,
      fields,
      value: (current?.value ?? 0) + 1,
    });
  }

  public observe(name: string, value: number, fields: MetricFields = {}): void {
    const key = `${name}|${fieldKey(fields)}`;
    const current = this.observations.get(key);
    this.observations.set(key, {
      name,
      fields,
      count: (current?.count ?? 0) + 1,
      total: (current?.total ?? 0) + value,
    });
  }

  public snapshot(): MetricsSnapshot {
    return {
      counters: [...this.counters.values()],
      observations: [...this.observations.values()],
    };
  }
}

let shared: InMemoryMetricsRecorder | undefined;

export function getProcessMetrics(): InMemoryMetricsRecorder {
  shared ??= new InMemoryMetricsRecorder();
  return shared;
}
