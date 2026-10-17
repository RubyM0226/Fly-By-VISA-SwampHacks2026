import type { NextRequest } from "next/server";
import demo from "@/data/flights-demo.json";
import { HOME_AIRPORTS, US_AIRPORTS } from "@/lib/flightData";
import { googleFlightsUrl, normalize, rankFlights, type FlightOption, type SerpResponse } from "@/lib/flights";

const HOME = new Set(HOME_AIRPORTS.map((a) => a.code));
const DEST = new Set(US_AIRPORTS.map((a) => a.code));

// Same search within an hour = no new SerpApi call (saves quota).
const cache = new Map<string, { at: number; body: unknown }>();
const HOUR_MS = 3_600_000;

// GET /api/flights?from=DEL&to=JFK&date=2026-12-10
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const from = (p.get("from") ?? "").toUpperCase();
  const to = (p.get("to") ?? "").toUpperCase();
  const date = p.get("date") ?? "";
  if (!HOME.has(from) || !DEST.has(to) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const cacheKey = `${from}-${to}-${date}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < HOUR_MS) return Response.json(hit.body);

  let raw: SerpResponse;
  let isDemo = false;
  try {
    const key = process.env.SERPAPI_KEY;
    if (!key) throw new Error("SERPAPI_KEY is not set");
    const url = new URL("https://serpapi.com/search.json");
    url.search = new URLSearchParams({
      engine: "google_flights",
      departure_id: from,
      arrival_id: to,
      outbound_date: date,
      type: "2", // one way
      currency: "USD",
      hl: "en",
      gl: "in",
      api_key: key,
    }).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`SerpApi responded ${res.status}`);
    raw = (await res.json()) as SerpResponse;
    if (!raw.best_flights?.length && !raw.other_flights?.length) throw new Error("no flights in response");
  } catch (err) {
    console.error("flight search failed, using demo data:", err);
    raw = demo as unknown as SerpResponse;
    isDemo = true;
  }

  const all = [...(raw.best_flights ?? []), ...(raw.other_flights ?? [])]
    .map(normalize)
    .filter((o): o is FlightOption => o !== null);
  const ranked = rankFlights(all);

  const body = {
    ...ranked,
    demo: isDemo,
    searched: { from, to, date },
    bookUrl: isDemo ? googleFlightsUrl(from, to, date) : (raw.search_metadata?.google_flights_url ?? googleFlightsUrl(from, to, date)),
  };
  if (!isDemo) cache.set(cacheKey, { at: Date.now(), body });
  return Response.json(body);
}
