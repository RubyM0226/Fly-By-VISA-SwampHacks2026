import { useSyncExternalStore } from "react";

type Listener = () => void;

export interface PersistedStore<T> {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (patch: Partial<T>) => void;
  reset: () => void;
}

/**
 * A tiny localStorage-backed store for useSyncExternalStore.
 *
 * Everything the user enters lives only in their browser. There is no server
 * round-trip, which is what lets us say "nothing leaves this device".
 */
export function createPersistedStore<T extends object>(
  key: string,
  defaults: T,
): PersistedStore<T> {
  const listeners = new Set<Listener>();
  let current: T = defaults;
  let loaded = false;

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      current = raw ? { ...defaults, ...(JSON.parse(raw) as Partial<T>) } : defaults;
    } catch {
      current = defaults;
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // Private mode or blocked storage: keep working in memory.
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          loaded = false;
          load();
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      load();
      return current;
    },
    getServerSnapshot() {
      return defaults;
    },
    set(patch) {
      load();
      current = { ...current, ...patch };
      persist();
      emit();
    },
    reset() {
      loaded = true;
      current = defaults;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      emit();
    },
  };
}

export function useStore<T>(store: PersistedStore<T>): [T, (patch: Partial<T>) => void] {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return [value, store.set];
}
