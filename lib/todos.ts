import { createPersistedStore, useStore } from "./store";

/**
 * Ticked "What to do" items, only in this browser (never the database).
 * Keyed by step id and item number ("ds160:2"), so a tick survives switching
 * language. Rewording an item in content/steps.ts keeps its tick; reordering moves it.
 */
export const todoStore = createPersistedStore<Record<string, boolean>>("flybyvisa:todos", {});

export const todoKey = (stepId: string, index: number) => `${stepId}:${index}`;

export function useTodos() {
  return useStore(todoStore);
}
