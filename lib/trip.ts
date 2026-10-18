import { createPersistedStore, useStore } from "./store";

/** What the traveler told us. Stored only in this browser. */
export type VisaPurpose = "family" | "study" | "work";

export interface Trip {
  from: "" | "IN";
  to: "" | "US";
  purpose: VisaPurpose;
  stayMonths: number;
  arrival: string;
  done: Record<string, boolean>;
  homeAirport: string;
  homeCity: string;
  destAirport: string;
  destCity: string;
  firstName: string;
  lastName: string;
}

export const DEFAULT_TRIP: Trip = {
  from: "",
  to: "",
  purpose: "family",
  stayMonths: 4,
  arrival: "",
  done: {},
  homeAirport: "DEL",
  homeCity: "New Delhi",
  destAirport: "JFK",
  destCity: "New York",
  firstName: "",
  lastName: "",
};

export const tripStore = createPersistedStore<Trip>("flybyvisa:trip", DEFAULT_TRIP);

export function useTrip() {
  return useStore(tripStore);
}