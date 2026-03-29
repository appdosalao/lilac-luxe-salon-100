type LoggedFetchOptions = {
  label: string;
  timeoutMs: number;
};

const shouldDebug = () => {
  try {
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    if (isDev) return true;
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debugSupabase');
  } catch {
    return false;
  }
};

export function createLoggedFetch({ label, timeoutMs }: LoggedFetchOptions) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestInit: RequestInit = {
        ...init,
        signal: init?.signal ?? controller.signal,
      };

      const res = await fetch(input, requestInit);
      const elapsedMs = Math.round(performance.now() - startedAt);

      if (shouldDebug()) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const path = (() => {
          try {
            const u = new URL(url);
            return `${u.origin}${u.pathname}`;
          } catch {
            return url;
          }
        })();
        console.debug(`[${label}]`, requestInit.method || 'GET', path, res.status, `${elapsedMs}ms`);
      }

      return res;
    } catch (err) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      if (shouldDebug()) console.debug(`[${label}]`, 'ERR', `${elapsedMs}ms`);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  };
}
