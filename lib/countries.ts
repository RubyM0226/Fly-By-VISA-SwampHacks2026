import type { UiKey } from "./i18n";

export type CountryCode = "IN" | "US" | "GB" | "CA" | "PH" | "NG" | "MX" | "AE" | "AU" | "DE" | "BR";

export interface Country {
  code: CountryCode;
  nameKey: UiKey;
  /** ISO 3166 numeric id, as used by the world-atlas country shapes. */
  mapId: string;
  lat: number;
  lng: number;
  /** Can be chosen as the place you are coming from. */
  origin: boolean;
  /** Can be chosen as the place you are going to. */
  destination: boolean;
}

// Live now: India, the United Kingdom and Mexico -> United States. The rest
// appear on the globe as "coming soon". To enable a country later, flip
// origin/destination and add its journey data (cities, wait times, offices,
// home-country content in lib/homeCountry.ts).
export const COUNTRIES = [
  { code: "IN", nameKey: "country.IN", mapId: "356", lat: 22.5, lng: 79, origin: true, destination: false },
  { code: "US", nameKey: "country.US", mapId: "840", lat: 39.5, lng: -98.5, origin: false, destination: true },
  { code: "GB", nameKey: "country.GB", mapId: "826", lat: 54, lng: -2.5, origin: true, destination: false },
  { code: "CA", nameKey: "country.CA", mapId: "124", lat: 56, lng: -106, origin: false, destination: false },
  { code: "PH", nameKey: "country.PH", mapId: "608", lat: 12.9, lng: 121.8, origin: false, destination: false },
  { code: "NG", nameKey: "country.NG", mapId: "566", lat: 9.1, lng: 8.7, origin: false, destination: false },
  { code: "MX", nameKey: "country.MX", mapId: "484", lat: 23.6, lng: -102.5, origin: true, destination: false },
  { code: "AE", nameKey: "country.AE", mapId: "784", lat: 23.4, lng: 53.8, origin: false, destination: false },
  { code: "AU", nameKey: "country.AU", mapId: "036", lat: -25.3, lng: 133.8, origin: false, destination: false },
  { code: "DE", nameKey: "country.DE", mapId: "276", lat: 51.2, lng: 10.4, origin: false, destination: false },
  { code: "BR", nameKey: "country.BR", mapId: "076", lat: -14.2, lng: -51.9, origin: false, destination: false },
] as const satisfies readonly Country[];

/** Countries that can be chosen as "coming from", derived from the list above. */
export type OriginCode = Extract<(typeof COUNTRIES)[number], { origin: true }>["code"];
export const ORIGIN_CODES = COUNTRIES.filter((c) => c.origin).map((c) => c.code) as OriginCode[];
export const isOrigin = (code: string): code is OriginCode => (ORIGIN_CODES as string[]).includes(code);

export const COUNTRY_BY_MAP_ID = Object.fromEntries(COUNTRIES.map((c) => [c.mapId, c])) as Record<string, Country>;

export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c])) as Record<CountryCode, Country>;

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Point halfway along the great circle between two places, for framing the arc. */
export function midpoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);
  const lat = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2));
  const lng = lng1 + Math.atan2(by, Math.cos(lat1) + bx);
  return { lat: toDeg(lat), lng: ((toDeg(lng) + 540) % 360) - 180 };
}
