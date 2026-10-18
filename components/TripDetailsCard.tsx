"use client";

import { useEffect, useRef, useState } from "react";
import { updateJourneyProfile } from "@/app/actions/journey";
import { useToday } from "@/lib/clock";
import { COUNTRIES, COUNTRY_BY_CODE, ORIGIN_CODES, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { addDays, formatDate } from "@/lib/journey";
import { tripStore, useTrip, type Trip } from "@/lib/trip";
import { CITIES_BY_COUNTRY, MONTH_CHOICES, tripFromProfile } from "@/lib/tripProfile";
import { DatePicker } from "./DatePicker";
import { Dropdown } from "./Dropdown";
import { PlaceSelect } from "./PlaceSelect";

type Draft = Pick<Trip, "from" | "homeCity" | "to" | "destCity" | "arrival" | "stayMonths">;
type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; text: string }
  | { kind: "error"; key: "trip.err.signedOut" | "trip.err.invalid" | "trip.err.save" | "start.needDate" | "start.pastDate" };

const SAVE_ERRORS = {
  pastDate: "start.pastDate",
  invalid: "trip.err.invalid",
  signedOut: "trip.err.signedOut",
  save: "trip.err.save",
} as const;

const DESTINATIONS = COUNTRIES.filter((c) => c.destination).map((c) => c.code);

/** The Account page's editable trip answers, so signed-in users never redo the intake. */
export function TripDetailsCard() {
  const { t, lang } = useT();
  const [trip] = useTrip();
  const today = useToday();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // null until the user edits, so the form follows tripStore (and the database sync) until then.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const form: Draft = draft ?? {
    from: trip.from || ORIGIN_CODES[0],
    homeCity: trip.homeCity,
    to: trip.to || "US",
    destCity: trip.destCity,
    arrival: trip.arrival,
    stayMonths: trip.stayMonths,
  };
  const edit = (patch: Partial<Draft>) => {
    setDraft({ ...form, ...patch });
    if (status.kind !== "saving") setStatus({ kind: "idle" });
  };
  const cityOptions = (code: string) => (CITIES_BY_COUNTRY[code] ?? []).map((c) => ({ value: c.city, label: `${c.city} (${c.airport})` }));
  const firstCity = (code: string) => CITIES_BY_COUNTRY[code]?.[0]?.city ?? "";

  // Arriving from the Dashboard's "Change my answers" (/account#trip-details): bring the card into view.
  useEffect(() => {
    if (window.location.hash !== "#trip-details") return;
    headingRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.arrival) return setStatus({ kind: "error", key: "start.needDate" });
    if (today && form.arrival <= today) return setStatus({ kind: "error", key: "start.pastDate" });

    setStatus({ kind: "saving" });
    try {
      const res = await updateJourneyProfile({
        from: form.from,
        fromCity: form.homeCity,
        homeAirport: "",
        to: form.to,
        toCity: form.destCity,
        destAirport: "",
        arrival: form.arrival,
        stayMonths: form.stayMonths,
        purpose: "family",
      });
      if (!res.ok) {
        return setStatus({ kind: "error", key: SAVE_ERRORS[res.error] });
      }
      // The roadmap, interview dates and flights all read tripStore, so they recompute from here.
      tripStore.set(tripFromProfile(res.profile));
      setDraft(null);
      const p = res.profile;
      setStatus({
        kind: "saved",
        text: t("trip.saved", {
          from: `${p.fromCity}, ${t(COUNTRY_BY_CODE[p.from as CountryCode].nameKey)}`,
          to: `${p.toCity}, ${t(COUNTRY_BY_CODE[p.to as CountryCode].nameKey)}`,
          date: formatDate(p.arrival, lang),
          stay: p.stayMonths === 1 ? t("start.month") : t("start.months", { n: p.stayMonths }),
        }),
      });
    } catch {
      setStatus({ kind: "error", key: "trip.err.save" });
    }
  }

  const saving = status.kind === "saving";

  return (
    <form
      id="trip-details"
      onSubmit={save}
      noValidate
      aria-labelledby="trip-title"
      className="scroll-mt-24 space-y-6 rounded-xl border-2 border-line-strong bg-surface p-6"
    >
      <div className="space-y-1">
        <h2 id="trip-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-accent">
          {t("trip.title")}
        </h2>
        <p className="text-lg text-muted">{t("trip.lead")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <PlaceSelect
            id="trip-from"
            label={t("trip.from")}
            enabled={ORIGIN_CODES}
            value={form.from}
            onChange={(code) => edit({ from: code as Trip["from"], homeCity: firstCity(code) })}
          />
          <div className="space-y-1">
            <p id="trip-from-city-label" className="text-base font-bold">
              {t("trip.fromCity")}
            </p>
            <Dropdown
              id="trip-from-city"
              labelledBy="trip-from-city-label"
              value={form.homeCity}
              options={cityOptions(form.from)}
              onChange={(city) => edit({ homeCity: city })}
            />
          </div>
        </div>
        <div className="space-y-4">
          <PlaceSelect
            id="trip-to"
            label={t("trip.to")}
            enabled={DESTINATIONS}
            value={form.to}
            onChange={(code) => edit({ to: code as Trip["to"], destCity: firstCity(code) })}
          />
          <div className="space-y-1">
            <p id="trip-to-city-label" className="text-base font-bold">
              {t("trip.toCity")}
            </p>
            <Dropdown
              id="trip-to-city"
              labelledBy="trip-to-city-label"
              value={form.destCity}
              options={cityOptions(form.to)}
              onChange={(city) => edit({ destCity: city })}
            />
          </div>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-xl font-bold">{t("start.why")}</legend>
        <label className="block cursor-pointer">
          <input type="radio" name="trip-purpose" value="family" checked readOnly className="peer sr-only" />
          <span className="flex min-h-14 items-center rounded-xl border-2 border-accent bg-accent px-4 py-3 text-lg font-semibold text-accent-ink peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
            {t("start.why.family")}
          </span>
        </label>
        {(["study", "work"] as const).map((p) => (
          <label key={p} className="block">
            <input type="radio" name="trip-purpose" disabled className="peer sr-only" />
            <span className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-dashed border-line-strong px-4 py-3 text-lg text-muted">
              <span>{t(p === "study" ? "start.why.study" : "start.why.work")}</span>
              <span className="text-base font-semibold">{t("home.comingSoon")}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <p id="trip-stay-label" className="text-xl font-bold">
          {t("start.howLong")}
        </p>
        <Dropdown
          id="trip-stay"
          labelledBy="trip-stay-label"
          value={form.stayMonths}
          options={MONTH_CHOICES.map((n) => ({ value: n, label: n === 1 ? t("start.month") : t("start.months", { n }) }))}
          onChange={(n) => edit({ stayMonths: n })}
          className="sm:w-72"
        />
      </div>

      <div className="space-y-2">
        <p id="trip-arrival-label" className="text-xl font-bold">
          {t("start.when")}
        </p>
        <p id="trip-arrival-help" className="text-lg text-muted">
          {t("start.whenHelp")}
        </p>
        {today && (
          <DatePicker
            id="trip-arrival"
            value={form.arrival}
            min={addDays(today, 1)}
            onChange={(day) => edit({ arrival: day })}
            labelledBy="trip-arrival-label"
            describedBy="trip-arrival-help"
            invalid={status.kind === "error" && status.key.startsWith("start.")}
          />
        )}
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-14 items-center justify-center rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink disabled:opacity-50"
        >
          {saving ? t("trip.saving") : t("trip.save")}
        </button>
        {status.kind === "saved" && (
          <p role="status" className="rounded-lg border-2 border-accent bg-accent-soft p-3 text-lg font-semibold">
            {status.text}
          </p>
        )}
        {status.kind === "error" && (
          <p role="alert" className="text-lg font-semibold text-danger">
            {t(status.key)}
          </p>
        )}
      </div>
    </form>
  );
}
