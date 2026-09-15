/* Minimal structured logger — swap for pino/winston in production. */
type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.toUpperCase()} ${message}`;
  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta !== undefined) fn(line, meta);
  else fn(line);
}

export const logger = {
  info: (m: string, meta?: unknown) => log('info', m, meta),
  warn: (m: string, meta?: unknown) => log('warn', m, meta),
  error: (m: string, meta?: unknown) => log('error', m, meta),
  debug: (m: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') log('debug', m, meta);
  },
};
