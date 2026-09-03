export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'session_pepper',
  'sessionpepper',
  'database_url',
  'databaseurl',
  'ai_api_key',
  'aiapikey',
  'apikey',
]);

function redact(fields: LogFields): LogFields {
  const safe: LogFields = {};

  for (const [key, value] of Object.entries(fields)) {
    safe[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[redacted]' : value;
  }

  return safe;
}

class ConsoleLogger implements Logger {
  public constructor(private readonly baseFields: LogFields = {}) {}

  public debug(message: string, fields?: LogFields): void {
    this.write('debug', message, fields);
  }

  public info(message: string, fields?: LogFields): void {
    this.write('info', message, fields);
  }

  public warn(message: string, fields?: LogFields): void {
    this.write('warn', message, fields);
  }

  public error(message: string, fields?: LogFields): void {
    this.write('error', message, fields);
  }

  public child(fields: LogFields): Logger {
    return new ConsoleLogger({ ...this.baseFields, ...fields });
  }

  private write(level: string, message: string, fields?: LogFields): void {
    const entry = {
      level,
      message,
      time: new Date().toISOString(),
      ...redact({ ...this.baseFields, ...fields }),
    };

    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}

export function createLogger(baseFields?: LogFields): Logger {
  return new ConsoleLogger(baseFields);
}

export {
  getProcessMetrics,
  InMemoryMetricsRecorder,
} from './metrics';
export type {
  MetricCounter,
  MetricFields,
  MetricObservation,
  MetricsRecorder,
  MetricsSnapshot,
} from './metrics';
export { readRequestId, requestIdHeaderName, resolveRequestId } from './request-id';
