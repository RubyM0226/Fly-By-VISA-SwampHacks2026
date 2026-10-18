import type { OriginCode } from "./countries";
import { createPersistedStore, useStore } from "./store";

/** What the traveler told us. Stored only in this browser. */
export type VisaPurpose = "family" | "study" | "work";

/** A flight the traveler picked on the Flights page, shown on the "Book your flight" step. */
export interface SelectedFlight {
  /** Flight numbers joined, as in FlightOption.key. With `date`, identifies the option. */
  key: string;
  date: string;
  price: number;
  minutes: number;
  stops: number;
  airlines: string[];
  legs: { flightNumber: string; from: string; to: string; departs: string; arrives: string }[];
}

export interface Trip {
  from: "" | OriginCode;
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
  /** Only in this browser, never saved to the database. */
  selectedFlight: SelectedFlight | null;
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
  selectedFlight: null,
};

export const tripStore = createPersistedStore<Trip>("flybyvisa:trip", DEFAULT_TRIP);

export function useTrip() {
  return useStore(tripStore);
}