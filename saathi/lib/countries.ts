import type { UiKey } from "./i18n";

export type CountryCode = "IN" | "US" | "GB" | "CA" | "PH" | "NG" | "MX" | "AE" | "AU" | "DE" | "BR";

export interface Country {
  code: CountryCode;
  nameKey: UiKey;
  lat: number;
  lng: number;
  /** Can be chosen as the place you are coming from. */
  origin: boolean;
  /** Can be chosen as the place you are going to. */
  destination: boolean;
}

// For the hackathon only India -> United States is live. The rest appear on the
// globe as "coming soon" so the product looks like it will grow. To enable a
// country later, flip origin/destination and add its journey data.
export const COUNTRIES: Country[] = [
  { code: "IN", nameKey: "country.IN", lat: 22.5, lng: 79, origin: true, destination: false },
  { code: "US", nameKey: "country.US", lat: 39.5, lng: -98.5, origin: false, destination: true },
  { code: "GB", nameKey: "country.GB", lat: 54, lng: -2.5, origin: false, destination: false },
  { code: "CA", nameKey: "country.CA", lat: 56, lng: -106, origin: false, destination: false },
  { code: "PH", nameKey: "country.PH", lat: 12.9, lng: 121.8, origin: false, destination: false },
  { code: "NG", nameKey: "country.NG", lat: 9.1, lng: 8.7, origin: false, destination: false },
  { code: "MX", nameKey: "country.MX", lat: 23.6, lng: -102.5, origin: false, destination: false },
  { code: "AE", nameKey: "country.AE", lat: 23.4, lng: 53.8, origin: false, destination: false },
  { code: "AU", nameKey: "country.AU", lat: -25.3, lng: 133.8, origin: false, destination: false },
  { code: "DE", nameKey: "country.DE", lat: 51.2, lng: 10.4, origin: false, destination: false },
  { code: "BR", nameKey: "country.BR", lat: -14.2, lng: -51.9, origin: false, destination: false },
];

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
