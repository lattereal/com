import { sql } from '@/lib/db';

// Database-backed fixed-window limiter. Shared by all Vercel instances.
export async function limitPersistent(key, max, windowMs) {
  const [row] = await sql`
    insert into rate_limits (key, window_start, hits)
    values (${key}, now(), 1)
    on conflict (key) do update set
      window_start = case
        when rate_limits.window_start <= now() - (${windowMs} * interval '1 millisecond') then now()
        else rate_limits.window_start
      end,
      hits = case
        when rate_limits.window_start <= now() - (${windowMs} * interval '1 millisecond') then 1
        else least(rate_limits.hits + 1, ${max} + 1)
      end
    returning hits
  `;
  return row.hits <= max;
}

// In-memory fallback retained for non-critical legacy call sites.
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
