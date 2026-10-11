// httpFetch.js
//
// A drop-in replacement for fetch() for the data scripts. The sources they read (Parliament's APIs, the ONS, Google News,
// GOV.UK) are public and occasionally slow, rate-limited or briefly down, and a bare fetch() never times out, so one stalled
// request could hang a whole nightly run. This one:
//   - gives up on a request that takes too long (the whole response, body included, not just the first byte),
//   - tries again after a pause, longer each time, when the request failed or the server said "busy" or "try later",
//   - obeys a Retry-After header when the server sends one,
//   - returns a normal Response, so callers keep their own `if (!res.ok)` handling for errors that retrying will not fix.
// It has no dependencies and no environment variables, so it can be tested without a network.

const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRY_WAIT_MS = 60_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// How long to wait before the next try: the server's Retry-After (seconds, or a date) if it sent one, otherwise 1s, 2s, 4s...
export function waitBeforeRetry(attempt, retryAfter, baseDelayMs = 1000) {
  let wait = baseDelayMs * 2 ** attempt;
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const fromHeader = Number.isFinite(seconds) ? seconds * 1000 : new Date(retryAfter).getTime() - Date.now();
    if (Number.isFinite(fromHeader) && fromHeader > 0) wait = fromHeader;
  }
  return Math.min(wait, MAX_RETRY_WAIT_MS);
}

async function attemptOnce(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs / 1000}s`)), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    // Read the body now, inside the timeout, so a response that starts and then stalls cannot hang the run.
    const body = await res.arrayBuffer();
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRetry(url, options = {}, { retries = 3, timeoutMs = 60_000, baseDelayMs = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await attemptOnce(url, options, timeoutMs);
      if (!RETRY_STATUS.has(res.status) || attempt === retries) return res;
      await sleep(waitBeforeRetry(attempt, res.headers.get("retry-after"), baseDelayMs));
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await sleep(waitBeforeRetry(attempt, null, baseDelayMs));
    }
  }
  throw new Error(`${lastError?.message ?? "Request failed"} (${url}, after ${retries + 1} tries)`);
}
