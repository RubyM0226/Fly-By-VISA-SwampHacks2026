import { COUNTRY_BY_CODE, type CountryCode } from "./countries";
import type { Trip } from "./trip";

export const MONTH_CHOICES = [1, 2, 3, 4, 5, 6];

/** Cities offered for each country, with the airport we fly from or to. */
export const CITIES_BY_COUNTRY: Record<string, { city: string; airport: string }[]> = {
  IN: [
    { city: "New Delhi", airport: "DEL" },
    { city: "Mumbai", airport: "BOM" },
    { city: "Bengaluru", airport: "BLR" },
    { city: "Hyderabad", airport: "HYD" },
    { city: "Chennai", airport: "MAA" },
  ],
  GB: [
    { city: "London", airport: "LHR" },
    { city: "Manchester", airport: "MAN" },
    { city: "Birmingham", airport: "BHX" },
    { city: "Edinburgh", airport: "EDI" },
    { city: "Glasgow", airport: "GLA" },
  ],
  MX: [
    { city: "Mexico City", airport: "MEX" },
    { city: "Guadalajara", airport: "GDL" },
    { city: "Monterrey", airport: "MTY" },
    { city: "Cancún", airport: "CUN" },
    { city: "Tijuana", airport: "TIJ" },
  ],
  US: [
    { city: "New York", airport: "JFK" },
    { city: "San Francisco", airport: "SFO" },
    { city: "Chicago", airport: "ORD" },
    { city: "Los Angeles", airport: "LAX" },
    { city: "Seattle", airport: "SEA" },
  ],
};

/** The journeys.profile column. Cities are saved as fromCity / toCity. */
export type VisaPurpose = "family" | "study" | "work";

export interface JourneyProfile {
  from: string;
  fromCity: string;
  homeAirport: string;
  to: string;
  toCity: string;
  destAirport: string;
  arrival: string;
  stayMonths: number;
  purpose: VisaPurpose;
  firstName?: string;
  lastName?: string;
}

/** Rows saved before the key fix used homeCity / destCity, so read both. */
type StoredProfile = Partial<JourneyProfile> & { homeCity?: string; destCity?: string };

/** A saved profile as tripStore fields (without `done`). */
export function tripFromProfile(p: StoredProfile | null | undefined): Omit<Trip, "done"> {
  return {
    from: (p?.from || "IN") as Trip["from"],
    homeCity: p?.fromCity || p?.homeCity || "New Delhi",
    homeAirport: p?.homeAirport || "DEL",
    to: (p?.to || "US") as Trip["to"],
    destCity: p?.toCity || p?.destCity || "New York",
    destAirport: p?.destAirport || "JFK",
    arrival: p?.arrival || "",
    stayMonths: p?.stayMonths || 1,
    purpose: (["family", "study", "work"].includes(p?.purpose as string) ? p?.purpose : "family") as VisaPurpose,
    firstName: p?.firstName || "",
    lastName: p?.lastName || "",
  };
}

export type ProfileError = "invalid" | "pastDate";

/**
 * Checks a profile sent by the browser. Only enabled countries and listed
 * cities pass; airports come from the city list, not the browser.
 * `today` is yyyy-mm-dd; the arrival must not be before it.
 */
export function cleanProfile(
  input: unknown,
  today: string,
): { ok: true; profile: JourneyProfile } | { ok: false; error: ProfileError } {
  const p = (input ?? {}) as Record<string, unknown>;
  const from = COUNTRY_BY_CODE[p.from as CountryCode];
  const to = COUNTRY_BY_CODE[p.to as CountryCode];
  if (!from?.origin || !to?.destination) return { ok: false, error: "invalid" };
  const home = CITIES_BY_COUNTRY[from.code]?.find((c) => c.city === p.fromCity);
  const dest = CITIES_BY_COUNTRY[to.code]?.find((c) => c.city === p.toCity);
  if (!home || !dest) return { ok: false, error: "invalid" };
  const arrival = typeof p.arrival === "string" ? p.arrival : "";
  const time = Date.parse(`${arrival}T00:00:00Z`);
  // Date.parse rolls 2026-02-30 over to March, so check it round-trips.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrival) || Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== arrival) {
    return { ok: false, error: "invalid" };
  }
  if (arrival < today) return { ok: false, error: "pastDate" };
  if (!MONTH_CHOICES.includes(p.stayMonths as number)) return { ok: false, error: "invalid" };
  if (!["family", "study", "work"].includes(p.purpose as string)) {
  return { ok: false, error: "invalid" };
}
  return {
    ok: true,
    profile: {
      from: from.code,
      fromCity: home.city,
      homeAirport: home.airport,
      to: to.code,
      toCity: dest.city,
      destAirport: dest.airport,
      arrival,
      stayMonths: p.stayMonths as number,
      purpose: (["family", "study", "work"].includes(p.purpose as string) ? p.purpose : "family") as VisaPurpose,
      firstName: typeof p.firstName === "string" ? p.firstName.trim() : "",
      lastName: typeof p.lastName === "string" ? p.lastName.trim() : "",
    },
  };
}