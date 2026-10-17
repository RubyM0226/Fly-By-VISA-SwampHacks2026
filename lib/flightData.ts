// Seed data for the flight finder. Same rules as lib/journey.ts: facts live
// here with a date and a source. needsCheck = confirm before the demo.

import type { Lang } from "./settings";

export interface Airport {
  code: string;
  city: Record<Lang, string>;
}

export const HOME_AIRPORTS: Airport[] = [
  { code: "DEL", city: { en: "Delhi", hi: "दिल्ली" } },
  { code: "BOM", city: { en: "Mumbai", hi: "मुंबई" } },
  { code: "BLR", city: { en: "Bengaluru", hi: "बेंगलुरु" } },
  { code: "HYD", city: { en: "Hyderabad", hi: "हैदराबाद" } },
  { code: "MAA", city: { en: "Chennai", hi: "चेन्नई" } },
  { code: "CCU", city: { en: "Kolkata", hi: "कोलकाता" } },
];

export const US_AIRPORTS: Airport[] = [
  { code: "JFK", city: { en: "New York", hi: "न्यूयॉर्क" } },
  { code: "EWR", city: { en: "Newark (near New York)", hi: "नेवार्क (न्यूयॉर्क के पास)" } },
  { code: "ORD", city: { en: "Chicago", hi: "शिकागो" } },
  { code: "SFO", city: { en: "San Francisco", hi: "सैन फ़्रांसिस्को" } },
  { code: "IAD", city: { en: "Washington, D.C.", hi: "वॉशिंगटन डी.सी." } },
  { code: "IAH", city: { en: "Houston", hi: "ह्यूस्टन" } },
  { code: "DFW", city: { en: "Dallas", hi: "डैलस" } },
  { code: "ATL", city: { en: "Atlanta", hi: "अटलांटा" } },
  { code: "LAX", city: { en: "Los Angeles", hi: "लॉस एंजेलिस" } },
  { code: "SEA", city: { en: "Seattle", hi: "सिएटल" } },
  { code: "BOS", city: { en: "Boston", hi: "बोस्टन" } },
  { code: "MCO", city: { en: "Orlando", hi: "ऑरलैंडो" } },
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
  if (HOME_AIRPORTS.some((a) => a.code === code) || IN_EXTRA.includes(code)) return "IN";
  return null;
}

/**
 * none  = no transit visa needed (Indian passport + valid U.S. visa, staying
 *         inside the airport, one ticket)
 * visa  = transit visa needed
 * check = we are not sure; tell the user to check with the airline
 */
export type TransitRule = "none" | "visa" | "check";

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
  IN: { name: { en: "India", hi: "भारत" }, transit: "none", advisory: null, needsCheck: false },
  US: { name: { en: "United States", hi: "अमेरिका" }, transit: "none", advisory: null, needsCheck: false },
  AE: { name: { en: "United Arab Emirates", hi: "संयुक्त अरब अमीरात" }, transit: "none", advisory: 3, needsCheck: true },
  QA: { name: { en: "Qatar", hi: "क़तर" }, transit: "none", advisory: 3, needsCheck: true },
  GB: { name: { en: "United Kingdom", hi: "ब्रिटेन" }, transit: "none", advisory: 2, needsCheck: true },
  DE: { name: { en: "Germany", hi: "जर्मनी" }, transit: "none", advisory: 2, needsCheck: true },
  FR: { name: { en: "France", hi: "फ़्रांस" }, transit: "none", advisory: 2, needsCheck: true },
  NL: { name: { en: "Netherlands", hi: "नीदरलैंड" }, transit: "none", advisory: 2, needsCheck: true },
  CH: { name: { en: "Switzerland", hi: "स्विट्ज़रलैंड" }, transit: "none", advisory: 1, needsCheck: true },
  AT: { name: { en: "Austria", hi: "ऑस्ट्रिया" }, transit: "none", advisory: 1, needsCheck: true },
  IT: { name: { en: "Italy", hi: "इटली" }, transit: "none", advisory: 2, needsCheck: true },
  FI: { name: { en: "Finland", hi: "फ़िनलैंड" }, transit: "none", advisory: 1, needsCheck: true },
  TR: { name: { en: "Türkiye", hi: "तुर्की" }, transit: "none", advisory: 2, needsCheck: true },
  IE: { name: { en: "Ireland", hi: "आयरलैंड" }, transit: "check", advisory: 1, needsCheck: true },
  CA: { name: { en: "Canada", hi: "कनाडा" }, transit: "visa", advisory: 1, needsCheck: true },
  SG: { name: { en: "Singapore", hi: "सिंगापुर" }, transit: "none", advisory: 1, needsCheck: true },
  HK: { name: { en: "Hong Kong", hi: "हांगकांग" }, transit: "none", advisory: 2, needsCheck: true },
  JP: { name: { en: "Japan", hi: "जापान" }, transit: "none", advisory: 1, needsCheck: true },
  KR: { name: { en: "South Korea", hi: "दक्षिण कोरिया" }, transit: "none", advisory: 1, needsCheck: true },
  CN: { name: { en: "China", hi: "चीन" }, transit: "check", advisory: 2, needsCheck: true },
  SA: { name: { en: "Saudi Arabia", hi: "सऊदी अरब" }, transit: "check", advisory: 3, needsCheck: true },
  KW: { name: { en: "Kuwait", hi: "कुवैत" }, transit: "check", advisory: 3, needsCheck: true },
  BH: { name: { en: "Bahrain", hi: "बहरीन" }, transit: "check", advisory: 3, needsCheck: true },
  OM: { name: { en: "Oman", hi: "ओमान" }, transit: "check", advisory: 3, needsCheck: true },
  ET: { name: { en: "Ethiopia", hi: "इथियोपिया" }, transit: "check", advisory: 3, needsCheck: true },
};
