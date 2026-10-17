import { useSyncExternalStore } from "react";

/** Local calendar date as yyyy-mm-dd. */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const noopSubscribe = () => () => {};

/**
 * Today's date on the client, empty string on the server.
 * Using useSyncExternalStore avoids hydration mismatches and keeps `new Date()`
 * out of server rendering (Cache Components is on in this Next.js version).
 */
export function useToday(): string {
  return useSyncExternalStore(noopSubscribe, todayISO, () => "");
}
