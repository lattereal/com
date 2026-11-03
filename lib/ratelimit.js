// In-memory sliding window. Fine for one instance; on Vercel each lambda has its own
// memory, so swap this for Upstash Redis (@upstash/ratelimit) before real traffic.
const store = globalThis.__rl || (globalThis.__rl = new Map());

export function limit(key, max, windowMs) {
  const now = Date.now();
  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    store.set(key, hits);
    return false;
  }
  hits.push(now);
  store.set(key, hits);
  return true;
}
