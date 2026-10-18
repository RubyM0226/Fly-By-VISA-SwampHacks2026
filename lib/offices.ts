import type { OriginCode } from "./countries";
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

export const OFFICE_MAPS: Record<OriginCode, HomeCountryMap> = {
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
  // VERIFY: approximate pins from memory, not checked against the embassy site.
  GB: {
    bounds: { south: 49.8, west: -8.7, north: 60.9, east: 1.8 },
    offices: [{ id: "london", kind: "embassy", lat: 51.4823, lng: -0.13, appointmentWaitDays: null }],
  },
  // VERIFY: approximate pins from memory, not checked against the embassy site.
  MX: {
    bounds: { south: 14.5, west: -118.4, north: 32.7, east: -86.7 },
    offices: [
      { id: "mexico-city", kind: "embassy", lat: 19.4413, lng: -99.2047, appointmentWaitDays: null },
      { id: "guadalajara", kind: "consulate", lat: 20.674, lng: -103.364, appointmentWaitDays: null },
      { id: "monterrey", kind: "consulate", lat: 25.6545, lng: -100.381, appointmentWaitDays: null },
      { id: "tijuana", kind: "consulate", lat: 32.53, lng: -116.978, appointmentWaitDays: null },
      { id: "ciudad-juarez", kind: "consulate", lat: 31.718, lng: -106.417, appointmentWaitDays: null },
      { id: "hermosillo", kind: "consulate", lat: 29.076, lng: -110.956, appointmentWaitDays: null },
      { id: "merida", kind: "consulate", lat: 21.02, lng: -89.62, appointmentWaitDays: null },
      { id: "nogales", kind: "consulate", lat: 31.295, lng: -110.95, appointmentWaitDays: null },
      { id: "nuevo-laredo", kind: "consulate", lat: 27.487, lng: -99.506, appointmentWaitDays: null },
      { id: "matamoros", kind: "consulate", lat: 25.879, lng: -97.511, appointmentWaitDays: null },
    ],
  },
};
