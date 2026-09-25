/**
 * Shared fetch helper: 8s AbortController timeout + limited retries.
 *
 * Retries only network-level failures (timeouts/aborts/connection errors),
 * never HTTP error statuses — so POST callers (login/register/advisory log)
 * cannot double-submit on a backend rejection. Offline fallbacks keep working
 * because timeouts surface as catchable AbortErrors like any network failure.
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

function isRetryableError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") return true;
    // Undici / browser network failures surface as TypeError
    if (err instanceof TypeError) return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
    retries = 1,
    retryDelayMs = 500,
    signal: outerSignal,
    ...fetchInit
  } = init;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const onOuterAbort = () => controller.abort();
    if (outerSignal) {
      if (outerSignal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException("Aborted", "AbortError");
      }
      outerSignal.addEventListener("abort", onOuterAbort, { once: true });
    }

    try {
      const res = await fetch(input, { ...fetchInit, signal: controller.signal });
      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isRetryableError(err)) throw err;
      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
