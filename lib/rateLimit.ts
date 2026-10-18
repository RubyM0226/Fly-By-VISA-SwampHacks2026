// Basic per-address limit, in memory (resets on deploy; good enough for a demo).
const WINDOW_MS = 60_000;

/** A limiter that allows `max` calls per address per minute. */
export function makeLimiter(max: number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
}
