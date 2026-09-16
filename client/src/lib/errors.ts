import { AxiosError } from 'axios';

/** Returns the HTTP status code from an axios error, or 0 if unknown. */
export function extractApiError(err: unknown): number {
  if (err instanceof AxiosError) return err.response?.status ?? 0;
  return 0;
}

/** Returns the server-provided error message if present. */
export function extractApiMessage(err: unknown): string | undefined {
  if (err instanceof AxiosError) {
    return err.response?.data?.error?.message as string | undefined;
  }
  return undefined;
}
