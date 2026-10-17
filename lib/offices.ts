import type { PostId } from "./journey";

// Where people go in person for the visa, by home country. Wait times come
// from WAIT_TIMES in lib/journey.ts, the same data as "Earliest interview".
//
// Coordinates are approximate building locations, good enough for a pin.
// VERIFY against the embassy site before the demo.

export interface Office {
  id: PostId;
  kind: "embassy" | "consulate";
  lat: number;
  lng: number;
  /**
   * Typical wait for the separate fingerprint (VAC) appointment, in days.
   * PLACEHOLDER: we have no source for this yet, so it is null and the page
   * says "not tracked yet". Fill in real numbers when we have them.
   */
  appointmentWaitDays: number | null;
}

export interface HomeCountryMap {
  /** Fits the whole country on screen. */
  bounds: { south: number; west: number; north: number; east: number };
  offices: Office[];
}

export const OFFICE_MAPS: Record<"IN", HomeCountryMap> = {
  IN: {
    bounds: { south: 6.5, west: 68, north: 35.7, east: 97.4 },
    offices: [
      { id: "delhi", kind: "embassy", lat: 28.5975, lng: 77.1859, appointmentWaitDays: null },
      { id: "mumbai", kind: "consulate", lat: 19.0653, lng: 72.8657, appointmentWaitDays: null },
      { id: "chennai", kind: "consulate", lat: 13.0524, lng: 80.251, appointmentWaitDays: null },
      { id: "hyderabad", kind: "consulate", lat: 17.4176, lng: 78.3449, appointmentWaitDays: null },
      { id: "kolkata", kind: "consulate", lat: 22.5452, lng: 88.3511, appointmentWaitDays: null },
    ],
  },
};
