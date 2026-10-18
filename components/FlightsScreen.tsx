"use client";

import Link from "next/link";
import { useState } from "react";
import { useToday } from "@/lib/clock";
import { ADVISORIES_CHECKED, COUNTRY_INFO, HOME_AIRPORTS_BY_COUNTRY, US_AIRPORTS } from "@/lib/flightData";
import { kayakUrl, PICK_ORDER, warningsFor, type FlightOption, type PickId } from "@/lib/flights";
import { useT } from "@/lib/i18n";
import { addDays, diffDays, formatDate } from "@/lib/journey";
import { tripStore, useTrip } from "@/lib/trip";
import { AlertIcon, ArrowIcon, ExternalIcon, PlaneIcon } from "./Icons";
import { BACK } from "./ScreenTransition";

interface Result {
  options: FlightOption[];
  picks: Partial<Record<PickId, string>>;
  bookUrl: string;
  demo: boolean;
  searched: { from: string; to: string; date: string };
}

/** Google Flights sells tickets about 11 months ahead. */
const BOOKING_WINDOW_DAYS = 320;

const selectClass =
  "min-h-14 w-full rounded-xl border-2 border-line-strong bg-surface px-4 text-lg font-semibold";

export function FlightsScreen() {
  const { t, lang } = useT();
  const [trip] = useTrip();
  const today = useToday();
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  if (!today) return null;
  if (!trip.arrival) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("flights.title")}</h1>
        <p className="text-xl">{t("journey.needInfo")}</p>
        <Link href="/start" transitionTypes={BACK} className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink">
          {t("journey.needInfoLink")}
          <ArrowIcon className="h-6 w-6" />
        </Link>
      </div>
    );
  }

  const wanted = addDays(trip.arrival, -1);
  const tooFar = diffDays(today, wanted) > BOOKING_WINDOW_DAYS;
  const date = tooFar ? addDays(today, 45) : wanted;

  async function search() {
    setStatus("loading");
    setResult(null);
    try {
      const q = new URLSearchParams({ from: trip.homeAirport, to: trip.destAirport, date });
      const res = await fetch(`/api/flights?${q}`);
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as Result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const byKey = new Map(result?.options.map((o) => [o.key, o]) ?? []);
  const pickedKeys = result
    ? [...new Set(PICK_ORDER.map((p) => result.picks[p]).filter((k): k is string => Boolean(k)))]
    : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("flights.title")}</h1>
        <p className="text-xl text-muted">{t("flights.lead")}</p>
      </div>

      <section className="space-y-4 rounded-2xl border-2 border-line bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="block text-lg font-bold">{t("flights.from")}</span>
            <select className={selectClass} value={trip.homeAirport} onChange={(e) => tripStore.set({ homeAirport: e.target.value })}>
              {HOME_AIRPORTS_BY_COUNTRY[trip.from || "IN"].map((a) => (
                <option key={a.code} value={a.code}>{a.city[lang]} ({a.code})</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-lg font-bold">{t("flights.to")}</span>
            <select className={selectClass} value={trip.destAirport} onChange={(e) => tripStore.set({ destAirport: e.target.value })}>
              {US_AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>{a.city[lang]} ({a.code})</option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-lg">{t("flights.date", { date: formatDate(wanted, lang) })}</p>
        {tooFar && <p className="rounded-xl bg-warm p-3 text-lg font-semibold text-warm-ink">{t("flights.sample", { date: formatDate(date, lang) })}</p>}
        <button
          type="button"
          onClick={search}
          disabled={status === "loading"}
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink disabled:opacity-60"
        >
          <PlaneIcon className="h-6 w-6" />
          {status === "loading" ? t("flights.searching") : t("flights.search")}
        </button>
      </section>

      <div aria-live="polite" className="space-y-6">
        {status === "error" && <p className="text-lg font-semibold text-danger">{t("flights.error")}</p>}
        {result?.demo && <p className="rounded-xl bg-warm p-3 text-lg text-warm-ink">{t("flights.demo")}</p>}
        {result && result.options.length === 0 && <p className="text-lg">{t("flights.none")}</p>}

        {result && pickedKeys.length > 0 && (
          <section aria-labelledby="picks-title" className="space-y-4">
            <h2 id="picks-title" className="text-2xl font-bold">{t("flights.picks")}</h2>
            {pickedKeys.map((key) => (
              <FlightCard
                key={key}
                option={byKey.get(key)!}
                labels={PICK_ORDER.filter((p) => result.picks[p] === key)}
                bookUrl={result.bookUrl}
                kayak={kayakUrl(result.searched.from, result.searched.to, result.searched.date)}
              />
            ))}
          </section>
        )}

        {result && result.options.length > pickedKeys.length && (
          <details className="rounded-2xl border-2 border-line p-4">
            <summary className="min-h-12 cursor-pointer text-xl font-bold">{t("flights.all", { n: result.options.length })}</summary>
            <div className="mt-4 space-y-4">
              {result.options.map((o) => (
                <FlightCard key={o.key} option={o} labels={[]} bookUrl={result.bookUrl} kayak={kayakUrl(result.searched.from, result.searched.to, result.searched.date)} />
              ))}
            </div>
          </details>
        )}

        <p className="text-base text-muted">{t("flights.disclaimer", { date: formatDate(ADVISORIES_CHECKED, lang) })}</p>
      </div>
    </div>
  );
}

function FlightCard({ option: o, labels, bookUrl, kayak }: { option: FlightOption; labels: PickId[]; bookUrl: string; kayak: string }) {
  const { t, lang } = useT();
  const money = new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const dur = (min: number) => t("flights.duration", { h: Math.floor(min / 60), m: min % 60 });
  const stops = o.stops === 0 ? t("flights.nonstop") : o.stops === 1 ? t("flights.oneStop") : t("flights.manyStops", { n: o.stops });
  const warn = warningsFor(o);

  return (
    <article className={`space-y-3 rounded-2xl border-2 bg-surface p-5 ${labels.length ? "border-accent" : "border-line"}`}>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {labels.map((p) => (
            <span key={p} className="rounded-full bg-accent-soft px-3 py-1 text-base font-bold">{t(`flights.pick.${p}`)}</span>
          ))}
        </div>
      )}
      {labels[0] && <p className="text-lg text-muted">{t(`flights.why.${labels[0]}`)}</p>}

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-3xl font-bold">{money.format(o.price)}</p>
        <p className="text-xl">{dur(o.minutes)} · {stops}</p>
        <p className="text-lg text-muted">{o.airlines.join(", ")}</p>
      </div>

      {o.layovers.map((l) => {
        const info = l.country ? COUNTRY_INFO[l.country] : undefined;
        const place = lang === "en" ? `${l.name} (${l.airport})` : `${info?.name.hi ?? l.name} (${l.airport})`;
        return (
          <div key={l.airport} className="space-y-1 rounded-xl border-2 border-line p-3">
            <p className="text-lg font-semibold">{t("flights.via", { place, time: dur(l.minutes) })}</p>
            <div className="flex flex-wrap gap-2 text-base">
              <span className={`rounded-full px-3 py-0.5 font-semibold ${l.transit === "none" ? "bg-accent-soft" : "bg-warm text-warm-ink"}`}>
                {t(`flights.transit.${l.transit}`)}
              </span>
              {l.advisory !== null && (
                <span className={`rounded-full px-3 py-0.5 font-semibold ${l.advisory >= 3 ? "bg-warm text-warm-ink" : "bg-accent-soft"}`}>
                  {t("flights.advisory", { n: l.advisory })}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {(warn.shortConnection || warn.longLayover || warn.overnight) && (
        <ul className="space-y-1 text-lg">
          {warn.shortConnection && <li className="flex items-center gap-2"><AlertIcon className="h-5 w-5" />{t("flights.warn.short")}</li>}
          {warn.longLayover && <li className="flex items-center gap-2"><AlertIcon className="h-5 w-5" />{t("flights.warn.long")}</li>}
          {warn.overnight && <li className="flex items-center gap-2"><AlertIcon className="h-5 w-5" />{t("flights.warn.overnight")}</li>}
        </ul>
      )}

      <div>
        <p className="text-base font-bold">{t("flights.lookFor")}</p>
        <ul className="text-base">
          {o.legs.map((leg) => (
            <li key={leg.flightNumber}>
              {leg.flightNumber} · {leg.from} {leg.departs.slice(11)} → {leg.to} {leg.arrives.slice(11)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={bookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 py-2 text-lg font-bold text-accent-ink">
          {t("flights.book")}
          <ExternalIcon className="h-4 w-4" />
          <span className="sr-only">{t("journey.opensNewTab")}</span>
        </a>
        <a href={kayak} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-bold">
          {t("flights.kayak")}
          <ExternalIcon className="h-4 w-4" />
          <span className="sr-only">{t("journey.opensNewTab")}</span>
        </a>
      </div>
    </article>
  );
}
