// Seed data for the flight finder. Same rules as lib/journey.ts: facts live
// here with a date and a source. needsCheck = confirm before the demo.

import type { OriginCode } from "./countries";
import type { Lang } from "./settings";

export interface Airport {
  code: string;
  city: Record<Lang, string>;
}

// Official names stay in English in every language for the UK and Mexico.
export const HOME_AIRPORTS_BY_COUNTRY: Record<OriginCode, Airport[]> = {
  IN: [
    { code: "DEL", city: { en: "Delhi", hi: "Delhi" } },
    { code: "BOM", city: { en: "Mumbai", hi: "Mumbai" } },
    { code: "BLR", city: { en: "Bengaluru", hi: "Bengaluru" } },
    { code: "HYD", city: { en: "Hyderabad", hi: "Hyderabad" } },
    { code: "MAA", city: { en: "Chennai", hi: "Chennai" } },
    { code: "CCU", city: { en: "Kolkata", hi: "Kolkata" } },
  ],
  GB: [
    { code: "LHR", city: { en: "London", hi: "London" } },
    { code: "MAN", city: { en: "Manchester", hi: "Manchester" } },
    { code: "BHX", city: { en: "Birmingham", hi: "Birmingham" } },
    { code: "EDI", city: { en: "Edinburgh", hi: "Edinburgh" } },
    { code: "GLA", city: { en: "Glasgow", hi: "Glasgow" } },
  ],
  MX: [
    { code: "MEX", city: { en: "Mexico City", hi: "Mexico City" } },
    { code: "GDL", city: { en: "Guadalajara", hi: "Guadalajara" } },
    { code: "MTY", city: { en: "Monterrey", hi: "Monterrey" } },
    { code: "CUN", city: { en: "Cancún", hi: "Cancún" } },
    { code: "TIJ", city: { en: "Tijuana", hi: "Tijuana" } },
  ],
};

/** Every home airport, all countries. */
export const HOME_AIRPORTS: Airport[] = Object.values(HOME_AIRPORTS_BY_COUNTRY).flat();

export const US_AIRPORTS: Airport[] = [
  { code: "JFK", city: { en: "New York", hi: "New York" } },
  { code: "EWR", city: { en: "Newark (near New York)", hi: "Newark (near New York)" } },
  { code: "ORD", city: { en: "Chicago", hi: "Chicago" } },
  { code: "SFO", city: { en: "San Francisco", hi: "San Francisco" } },
  { code: "IAD", city: { en: "Washington, D.C.", hi: "Washington, D.C." } },
  { code: "IAH", city: { en: "Houston", hi: "Houston" } },
  { code: "DFW", city: { en: "Dallas", hi: "Dallas" } },
  { code: "ATL", city: { en: "Atlanta", hi: "Atlanta" } },
  { code: "LAX", city: { en: "Los Angeles", hi: "Los Angeles" } },
  { code: "SEA", city: { en: "Seattle", hi: "Seattle" } },
  { code: "BOS", city: { en: "Boston", hi: "Boston" } },
  { code: "MCO", city: { en: "Orlando", hi: "Orlando" } },
];

/** Common layover airports -> country code. */
const HUB_COUNTRY: Record<string, string> = {
  DXB: "AE", AUH: "AE", DOH: "QA", LHR: "GB", FRA: "DE", MUC: "DE", CDG: "FR",
  AMS: "NL", ZRH: "CH", VIE: "AT", FCO: "IT", HEL: "FI", IST: "TR", DUB: "IE",
  YYZ: "CA", YVR: "CA", SIN: "SG", HKG: "HK", NRT: "JP", HND: "JP", ICN: "KR",
  PEK: "CN", PVG: "CN", JED: "SA", RUH: "SA", KWI: "KW", BAH: "BH", MCT: "OM",
  ADD: "ET",
};
const US_EXTRA = ["CLT", "PHL", "DTW", "MSP", "DEN", "MIA", "PHX", "SLC", "LAS", "SAN", "PDX", "AUS", "RDU", "BWI", "TPA", "FLL"];
const IN_EXTRA = ["AMD", "COK", "GOI", "PNQ", "TRV", "LKO", "ATQ", "JAI"];

export function countryOfAirport(code: string): string | null {
  if (HUB_COUNTRY[code]) return HUB_COUNTRY[code];
  if (US_AIRPORTS.some((a) => a.code === code) || US_EXTRA.includes(code)) return "US";
  if (IN_EXTRA.includes(code)) return "IN";
  for (const [country, airports] of Object.entries(HOME_AIRPORTS_BY_COUNTRY)) {
    if (airports.some((a) => a.code === code)) return country;
  }
  return null;
}

/**
 * none  = no transit visa needed (Indian passport + valid U.S. visa, staying
 *         inside the airport, one ticket)
 * visa  = transit visa needed
 * check = we are not sure; tell the user to check with the airline
 */
export type TransitRule = "none" | "visa" | "check";

/**
 * The transit rule for a layover, for a traveler from `home`. The COUNTRY_INFO
 * rules are written for an Indian passport, so other travelers get "check"
 * except in their own country or the U.S.
 */
export function transitFor(country: string | null, home: string): TransitRule {
  if (country && (country === home || country === "US")) return "none";
  if (home !== "IN") return "check";
  return (country ? COUNTRY_INFO[country]?.transit : undefined) ?? "check";
}

export interface CountryInfo {
  name: Record<Lang, string>;
  transit: TransitRule;
  /** U.S. State Dept advisory level 1-4. null = home or destination country. */
  advisory: 1 | 2 | 3 | 4 | null;
  needsCheck: boolean;
}

// Advisory levels: travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html
// Copied 2026-10-17. Update ADVISORIES_CHECKED when you re-check.
export const ADVISORIES_CHECKED = "2026-10-17";

// TRANSIT RULES: VERIFY every row against the country's official
// transit-visa page (or IATA Timatic via an airline) before the demo.
// The "none" rows for UK and Schengen rely on their exemptions for
// people holding a valid U.S. visa.
export const COUNTRY_INFO: Record<string, CountryInfo> = {
  IN: { name: { en: "India", hi: "India" }, transit: "none", advisory: null, needsCheck: false },
  US: { name: { en: "United States", hi: "United States" }, transit: "none", advisory: null, needsCheck: false },
  AE: { name: { en: "United Arab Emirates", hi: "United Arab Emirates" }, transit: "none", advisory: 3, needsCheck: true },
  QA: { name: { en: "Qatar", hi: "Qatar" }, transit: "none", advisory: 3, needsCheck: true },
  GB: { name: { en: "United Kingdom", hi: "United Kingdom" }, transit: "none", advisory: 2, needsCheck: true },
  DE: { name: { en: "Germany", hi: "Germany" }, transit: "none", advisory: 2, needsCheck: true },
  FR: { name: { en: "France", hi: "France" }, transit: "none", advisory: 2, needsCheck: true },
  NL: { name: { en: "Netherlands", hi: "Netherlands" }, transit: "none", advisory: 2, needsCheck: true },
  CH: { name: { en: "Switzerland", hi: "Switzerland" }, transit: "none", advisory: 1, needsCheck: true },
  AT: { name: { en: "Austria", hi: "Austria" }, transit: "none", advisory: 1, needsCheck: true },
  IT: { name: { en: "Italy", hi: "Italy" }, transit: "none", advisory: 2, needsCheck: true },
  FI: { name: { en: "Finland", hi: "Finland" }, transit: "none", advisory: 1, needsCheck: true },
  TR: { name: { en: "Türkiye", hi: "Türkiye" }, transit: "none", advisory: 2, needsCheck: true },
  IE: { name: { en: "Ireland", hi: "Ireland" }, transit: "check", advisory: 1, needsCheck: true },
  CA: { name: { en: "Canada", hi: "Canada" }, transit: "visa", advisory: 1, needsCheck: true },
  SG: { name: { en: "Singapore", hi: "Singapore" }, transit: "none", advisory: 1, needsCheck: true },
  HK: { name: { en: "Hong Kong", hi: "Hong Kong" }, transit: "none", advisory: 2, needsCheck: true },
  JP: { name: { en: "Japan", hi: "Japan" }, transit: "none", advisory: 1, needsCheck: true },
  KR: { name: { en: "South Korea", hi: "South Korea" }, transit: "none", advisory: 1, needsCheck: true },
  CN: { name: { en: "China", hi: "China" }, transit: "check", advisory: 2, needsCheck: true },
  SA: { name: { en: "Saudi Arabia", hi: "Saudi Arabia" }, transit: "check", advisory: 3, needsCheck: true },
  KW: { name: { en: "Kuwait", hi: "Kuwait" }, transit: "check", advisory: 3, needsCheck: true },
  BH: { name: { en: "Bahrain", hi: "Bahrain" }, transit: "check", advisory: 3, needsCheck: true },
  OM: { name: { en: "Oman", hi: "Oman" }, transit: "check", advisory: 3, needsCheck: true },
  ET: { name: { en: "Ethiopia", hi: "Ethiopia" }, transit: "check", advisory: 3, needsCheck: true },
  // VERIFY: Mexico's advisory is set per state; 2 is the country-wide level as we last saw it.
  MX: { name: { en: "Mexico", hi: "Mexico" }, transit: "check", advisory: 2, needsCheck: true },
};
