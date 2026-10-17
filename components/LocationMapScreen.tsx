"use client";

/// <reference types="google.maps" />

import { useEffect, useMemo, useRef, useState } from "react";
import { useToday } from "@/lib/clock";
import { useT } from "@/lib/i18n";
import { buildJourney, formatDate, WAIT_TIMES, WAIT_TIMES_AS_OF, type PostId } from "@/lib/journey";
import { OFFICE_MAPS, type Office } from "@/lib/offices";
import { useTrip } from "@/lib/trip";

// Set in .env.local. NEXT_PUBLIC_ so the browser can use it; restrict the key
// to this site's address in Google Cloud. The placeholder value
// "YOUR_GOOGLE_MAPS_API_KEY" counts as not set, so the page shows its
// friendly message instead of asking Google with a fake key.
const RAW_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
const API_KEY = RAW_KEY && !RAW_KEY.startsWith("YOUR_") ? RAW_KEY : "";
// Custom pins need a Map ID. DEMO_MAP_ID works for development.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

declare global {
  interface Window {
    __flybyvisaMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

let mapsPromise: Promise<void> | null = null;
/** Load the Maps JavaScript API once per page. */
function loadMaps(onAuthFailure: () => void): Promise<void> {
  window.gm_authFailure = onAuthFailure;
  // The types assume google.maps always exists; at runtime it may not yet.
  const loaded = (window as unknown as { google?: { maps?: { importLibrary?: unknown } } }).google?.maps?.importLibrary;
  if (loaded) return Promise.resolve();
  mapsPromise ??= new Promise<void>((resolve, reject) => {
    window.__flybyvisaMapsReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&v=weekly&loading=async&callback=__flybyvisaMapsReady`;
    script.async = true;
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error("maps script failed"));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

/** The pin: a teardrop in our green with the city name under it. */
function pinElement(label: string, embassy: boolean) {
  const wrap = document.createElement("div");
  wrap.className = `map-pin${embassy ? " map-pin--embassy" : ""}`;
  wrap.innerHTML =
    '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 31s10-11.2 10-19A10 10 0 0 0 2 12c0 7.8 10 19 10 19Z"/><circle cx="12" cy="12" r="4"/></svg>';
  const name = document.createElement("span");
  name.className = "map-pin-label";
  name.textContent = label;
  wrap.appendChild(name);
  return wrap;
}

export function LocationMapScreen() {
  const { t, lang } = useT();
  const [trip] = useTrip();
  const today = useToday();
  const home = OFFICE_MAPS.IN; // only India -> U.S. for now

  // Same numbers as the "Earliest interview" calculation.
  const waits = useMemo(() => Object.fromEntries(WAIT_TIMES.map((w) => [w.id, w.waitMonths])) as Record<PostId, number>, []);
  const earliest = useMemo(() => {
    if (!today || !trip.arrival) return null;
    const journey = buildJourney({ today, arrival: trip.arrival, stayMonths: trip.stayMonths });
    return Object.fromEntries(journey.posts.map((p) => [p.id, p.interviewDate])) as Record<PostId, string>;
  }, [today, trip.arrival, trip.stayMonths]);

  const officeLines = (o: Office) => ({
    title: `${t(o.kind === "embassy" ? "map.embassy" : "map.consulate")} · ${t(`post.${o.id}`)}`,
    lines: [
      t("map.interviewWait", { n: waits[o.id] }),
      ...(earliest ? [t("map.earliest", { date: formatDate(earliest[o.id], lang) })] : []),
      o.appointmentWaitDays === null
        ? t("map.appointmentUnknown")
        : t("map.appointmentWait", { n: o.appointmentWaitDays }),
    ],
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">(API_KEY ? "loading" : "error");
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  // Load the API and draw the map once.
  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;
    loadMaps(() => setStatus("error"))
      .then(async () => {
        const { Map, InfoWindow } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (cancelled || !mapEl.current) return;
        const map = new Map(mapEl.current, {
          mapId: MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative", // page scrolling stays easy
          clickableIcons: false,
        });
        map.fitBounds(home.bounds, 24);
        infoRef.current = new InfoWindow({ headerDisabled: true });
        map.addListener("click", () => infoRef.current?.close());
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [home.bounds]);

  // Pins, redrawn when the language or the trip changes.
  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (status !== "ready" || !map || !info) return;
    const markers = home.offices.map((o) => {
      const { title, lines } = officeLines(o);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: o.lat, lng: o.lng },
        title,
        content: pinElement(t(`post.${o.id}`), o.kind === "embassy"),
        gmpClickable: true,
      });
      const show = () => {
        const card = document.createElement("div");
        card.className = "map-card";
        const h = document.createElement("p");
        h.className = "map-card-title";
        h.textContent = title;
        card.appendChild(h);
        for (const line of lines) {
          const p = document.createElement("p");
          p.textContent = line;
          card.appendChild(p);
        }
        const note = document.createElement("p");
        note.className = "map-card-note";
        note.textContent = t("map.asOf", { date: formatDate(WAIT_TIMES_AS_OF, lang) });
        card.appendChild(note);
        info.setContent(card);
        info.open({ map, anchor: marker, shouldFocus: false });
      };
      // Hover on a mouse; tap (or Enter on a keyboard) everywhere.
      marker.content?.addEventListener("mouseenter", show);
      marker.content?.addEventListener("mouseleave", () => info.close());
      marker.addListener("gmp-click", show);
      return marker;
    });
    return () => {
      info.close();
      for (const m of markers) m.map = null;
    };
    // officeLines is rebuilt each render from t, lang and earliest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lang, earliest, home.offices]);

  return (
    <div data-hills-peek className="space-y-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{t("nav.map")}</h1>
        <p className="text-lg text-muted">{t("map.intro")}</p>
      </div>

      {status === "error" ? (
        <p role="status" className="rounded-xl border-2 border-warm-ink bg-warm p-4 text-lg text-warm-ink">
          {t(API_KEY ? "map.loadError" : "map.missingKey")}
        </p>
      ) : (
        <div
          ref={mapEl}
          role="region"
          aria-label={t("map.label")}
          className="h-[60vh] min-h-[22rem] w-full overflow-hidden rounded-2xl border-2 border-line-strong bg-surface"
        />
      )}

      {/* The same information as a plain list, for keyboards, screen readers and no-map cases. */}
      <section aria-labelledby="offices-title" className="space-y-3">
        <h2 id="offices-title" className="text-2xl font-bold">
          {t("map.listTitle")}
        </h2>
        <ul className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-5">
          {home.offices.map((o) => {
            const { title, lines } = officeLines(o);
            return (
              <li key={o.id} className="space-y-1 rounded-xl border-2 border-line-strong bg-surface p-4">
                <p className="text-lg font-bold">{title}</p>
                {lines.map((line) => (
                  <p key={line} className="text-base">
                    {line}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted">{t("map.asOf", { date: formatDate(WAIT_TIMES_AS_OF, lang) })}</p>
      </section>
    </div>
  );
}
