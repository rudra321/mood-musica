// Minimal JSON-over-HTTP helper: adds a timeout (via AbortController) and
// normalizes failures into one error type. Shared by every adapter so fetch
// boilerplate isn't duplicated.

export class FetchJsonError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, body?: string, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "FetchJsonError";
    this.status = opts.status;
    this.body = opts.body;
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

/**
 * @param {string} url
 * @param {{ method?: string, headers?: Record<string,string>, body?: string, timeoutMs?: number }} [opts]
 * @returns {Promise<any>} parsed JSON (or null for an empty body)
 */
export async function fetchJson(url, opts = {}) {
  const { method = "GET", headers = {}, body, timeoutMs = 12000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, { method, headers, body, signal: controller.signal });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    throw new FetchJsonError(
      timedOut ? `Request to ${url} timed out` : `Request to ${url} failed`,
      { cause: err }
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new FetchJsonError(`Request to ${url} returned ${res.status}`, {
      status: res.status,
      body: text.slice(0, 500),
    });
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch (err) {
    throw new FetchJsonError(`Response from ${url} was not valid JSON`, { cause: err });
  }
}
