import { createPersistedStore, useStore } from "./store";

/** What the traveler told us. Stored only in this browser. */
export interface Trip {
  from: "" | "IN";
  to: "" | "US";
  purpose: "family";
  stayMonths: number;
  /** yyyy-mm-dd, the day they want to arrive */
  arrival: string;
  /** step ids the traveler marked as done */
  done: Record<string, boolean>;
}

export const DEFAULT_TRIP: Trip = {
  from: "",
  to: "",
  purpose: "family",
  stayMonths: 4,
  arrival: "",
  done: {},
};

export const tripStore = createPersistedStore<Trip>("flybyvisa:trip", DEFAULT_TRIP);

export function useTrip() {
  return useStore(tripStore);
}
