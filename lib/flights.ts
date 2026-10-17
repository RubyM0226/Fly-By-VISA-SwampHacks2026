import { COUNTRY_INFO, countryOfAirport, type TransitRule } from "./flightData";

// ---- SerpApi shapes (only the fields we use) ----
interface SerpAirport { id: string; name: string; time: string }
interface SerpSegment {
  departure_airport: SerpAirport;
  arrival_airport: SerpAirport;
  duration: number;
  airline: string;
  airline_logo?: string;
  flight_number: string;
}
interface SerpLayover { id: string; name: string; duration: number; overnight?: boolean }
export interface SerpItinerary {
  flights: SerpSegment[];
  layovers?: SerpLayover[];
  total_duration: number;
  price?: number;
  airline_logo?: string;
}
export interface SerpResponse {
  best_flights?: SerpItinerary[];
  other_flights?: SerpItinerary[];
  search_metadata?: { google_flights_url?: string };
}

// ---- Our shapes ----
export interface Leg {
  from: string;
  to: string;
  departs: string; // "2026-12-10 02:15"
  arrives: string;
  airline: string;
  flightNumber: string;
  minutes: number;
}
export interface Layover {
  airport: string;
  name: string;
  minutes: number;
  overnight: boolean;
  country: string | null;
  transit: TransitRule;
  advisory: number | null;
}
export interface FlightOption {
  key: string;
  price: number;
  minutes: number;
  stops: number;
  airlines: string[];
  logo?: string;
  legs: Leg[];
  layovers: Layover[];
}

export type PickId = "best" | "cheapest" | "fastest" | "easiest" | "lowestRisk";
export const PICK_ORDER: PickId[] = ["best", "cheapest", "fastest", "easiest", "lowestRisk"];

/** Our own rules of thumb, not official numbers. Tune here. */
export const FLIGHT_RULES = {
  shortConnectionMin: 90, // under this is risky for a senior
  longLayoverMin: 360, // over this is tiring
  highAdvisory: 3,
} as const;

export function normalize(it: SerpItinerary): FlightOption | null {
  if (typeof it.price !== "number" || !it.flights?.length) return null;
  const legs: Leg[] = it.flights.map((s) => ({
    from: s.departure_airport.id,
    to: s.arrival_airport.id,
    departs: s.departure_airport.time,
    arrives: s.arrival_airport.time,
    airline: s.airline,
    flightNumber: s.flight_number,
    minutes: s.duration,
  }));
  const layovers: Layover[] = (it.layovers ?? []).map((l) => {
    const country = countryOfAirport(l.id);
    const info = country ? COUNTRY_INFO[country] : undefined;
    return {
      airport: l.id,
      name: l.name,
      minutes: l.duration,
      overnight: Boolean(l.overnight),
      country,
      transit: info?.transit ?? "check",
      advisory: info?.advisory ?? null,
    };
  });
  return {
    key: legs.map((l) => l.flightNumber).join("+"),
    price: it.price,
    minutes: it.total_duration,
    stops: layovers.length,
    airlines: [...new Set(legs.map((l) => l.airline))],
    logo: it.airline_logo,
    legs,
    layovers,
  };
}

export const worstAdvisory = (o: FlightOption) => Math.max(0, ...o.layovers.map((l) => l.advisory ?? 0));

export function warningsFor(o: FlightOption) {
  return {
    shortConnection: o.layovers.some((l) => l.minutes < FLIGHT_RULES.shortConnectionMin),
    longLayover: o.layovers.some((l) => l.minutes > FLIGHT_RULES.longLayoverMin),
    overnight: o.layovers.some((l) => l.overnight),
  };
}

/** Lower is better. Stops, short or long connections and overnights cost "minutes". */
function easeScore(o: FlightOption): number {
  let s = o.minutes + o.stops * 180;
  for (const l of o.layovers) {
    if (l.minutes < FLIGHT_RULES.shortConnectionMin) s += 240;
    if (l.minutes > FLIGHT_RULES.longLayoverMin) s += l.minutes - FLIGHT_RULES.longLayoverMin;
    if (l.overnight) s += 300;
  }
  return s;
}

/** Lower is better. A needed transit visa outweighs everything else. */
function riskScore(o: FlightOption): number {
  let r = worstAdvisory(o) * 10;
  for (const l of o.layovers) {
    if (l.transit === "visa") r += 100;
    if (l.transit === "check") r += 20;
  }
  return r;
}

function minBy(options: FlightOption[], score: (o: FlightOption) => number): FlightOption {
  return options.reduce((a, b) => (score(b) < score(a) ? b : a));
}

export function rankFlights(all: FlightOption[]) {
  const options = [...new Map(all.map((o) => [o.key, o])).values()].sort((a, b) => a.price - b.price);
  const picks: Partial<Record<PickId, string>> = {};
  if (!options.length) return { options, picks };

  const minPrice = Math.min(...options.map((o) => o.price));
  const minTime = Math.min(...options.map((o) => o.minutes));
  // Price is the tie-breaker everywhere (tiny weight).
  const tie = (o: FlightOption) => o.price / 1e6;

  picks.cheapest = minBy(options, (o) => o.price).key;
  picks.fastest = minBy(options, (o) => o.minutes + tie(o)).key;
  picks.easiest = minBy(options, (o) => easeScore(o) + tie(o)).key;
  picks.lowestRisk = minBy(options, (o) => riskScore(o) * 1e5 + o.price).key;
  picks.best = minBy(
    options,
    (o) =>
      o.price / minPrice +
      o.minutes / minTime +
      0.25 * o.stops +
      (riskScore(o) >= 100 ? 1 : 0) +
      (worstAdvisory(o) >= FLIGHT_RULES.highAdvisory ? 0.5 : 0),
  ).key;

  return { options, picks };
}

export function googleFlightsUrl(from: string, to: string, date: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${from} to ${to} on ${date} one way`)}`;
}

export function kayakUrl(from: string, to: string, date: string): string {
  return `https://www.kayak.com/flights/${from}-${to}/${date}?sort=bestflight_a`;
}
