"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { addDays } from "@/lib/journey";
import { useToday } from "@/lib/clock";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { ArrowIcon } from "./Icons";
import { Dropdown } from "./Dropdown";
import { InfoTip } from "./InfoTip";
import { DatePicker } from "./DatePicker";
import { BACK, FORWARD } from "./ScreenTransition";
import { createIntakeJourney, updateJourneyProfile } from "@/app/actions/journey";
import { CITIES_BY_COUNTRY, MONTH_CHOICES } from "@/lib/tripProfile";

export function StartScreen() {
  const { t } = useT();
  const router = useRouter();
  const [trip] = useTrip();
  const update = tripStore.set;
  const today = useToday();
  const { user } = useUser();
  const [error, setError] = useState<"" | "needDate" | "pastDate" | "saveFailed">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useLayoutEffect(() => () => setIsSubmitting(false), []);
  const dateRef = useRef<{ focus: () => void } | null>(null);

  const placesChosen = trip.from === "IN" && trip.to === "US";

  const homeCityOptions = CITIES_BY_COUNTRY["IN"] || [];
  const destCityOptions = CITIES_BY_COUNTRY["US"] || [];

  if (!placesChosen) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("start.title")}</h1>
        <p className="text-xl">{t("start.needPlaces")}</p>
        <Link
          href="/places"
          transitionTypes={BACK}
          data-button
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
        >
          {t("start.goHome")}
          <ArrowIcon className="h-6 w-6" />
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip.arrival) {
      setError("needDate");
      dateRef.current?.focus();
      return;
    }
    if (today && trip.arrival <= today) {
      setError("pastDate");
      dateRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    const profile = {
      from: trip.from,
      fromCity: trip.homeCity || "New Delhi",
      homeAirport: trip.homeAirport || "DEL",
      to: trip.to,
      toCity: trip.destCity || "New York",
      destAirport: trip.destAirport || "JFK",
      arrival: trip.arrival,
      stayMonths: trip.stayMonths,
      purpose: trip.purpose || "family",
      firstName: trip.firstName || "",
      lastName: trip.lastName || "",
    };

    if (user) {
      const res = await updateJourneyProfile(profile).catch(() => null);
      if (!res?.ok) {
        setIsSubmitting(false);
        setError(res?.ok === false && res.error === "pastDate" ? "pastDate" : "saveFailed");
        return;
      }
    } else {
      try {
        const res = await createIntakeJourney(profile);
        if (res?.id) {
          localStorage.setItem("temp_journey_id", res.id);
        }
      } catch (err) {
        console.error("Database connection failed", err);
      }
    }

    router.push("/journey", { transitionTypes: FORWARD });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto w-full max-w-2xl space-y-8 @5xl:grid @5xl:max-w-none @5xl:grid-cols-2 @5xl:items-start @5xl:gap-x-12 @5xl:space-y-0"
    >
      <div className="space-y-8">
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-bold sm:text-4xl">{t("start.title")}</h1>
          <InfoTip label={t("start.privacyLabel")}>{t("start.privacyTip")}</InfoTip>
        </div>

        {/* Traveler First and Last Name Inputs */}
        <div className="space-y-4 rounded-xl border-2 border-line bg-surface p-4">
          <h2 className="text-lg font-bold text-slate-800">Traveler Name</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700">First Name</label>
              <input
                type="text"
                placeholder="First name"
                value={trip.firstName || ""}
                onChange={(e) => update({ firstName: e.target.value })}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-base font-medium bg-white text-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                value={trip.lastName || ""}
                onChange={(e) => update({ lastName: e.target.value })}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-base font-medium bg-white text-slate-900"
                required
              />
            </div>
          </div>
        </div>

        {/* City and Airport Selection */}
        <div className="space-y-4 rounded-xl border-2 border-line bg-surface p-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">{t("start.departureCity")}</label>
            <select
              value={trip.homeCity || "New Delhi"}
              onChange={(e) => {
                const selected = homeCityOptions.find(c => c.city === e.target.value);
                if (selected) {
                  update({ homeCity: selected.city, homeAirport: selected.airport });
                }
              }}
              className="w-full rounded-xl border-2 border-line px-4 py-3 text-base font-medium bg-white text-slate-900"
            >
              {homeCityOptions.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city} ({item.airport})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">{t("start.arrivalCity")}</label>
            <select
              value={trip.destCity || "New York"}
              onChange={(e) => {
                const selected = destCityOptions.find(c => c.city === e.target.value);
                if (selected) {
                  update({ destCity: selected.city, destAirport: selected.airport });
                }
              }}
              className="w-full rounded-xl border-2 border-line px-4 py-3 text-base font-medium bg-white text-slate-900"
            >
              {destCityOptions.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city} ({item.airport})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Why / Visa Type */}
<fieldset className="space-y-3">
  <legend className="mb-1 text-xl font-bold">{t("start.why")}</legend>
  {(
    [
      { value: "family", labelKey: "start.why.family" },
      { value: "study", labelKey: "start.why.study" },
      { value: "work", labelKey: "start.why.work" },
    ] as const
  ).map((item) => {
    const isSelected = (trip.purpose || "family") === item.value;
    return (
      <label key={item.value} className="block cursor-pointer">
        <input
          type="radio"
          name="purpose"
          value={item.value}
          checked={isSelected}
          onChange={() => update({ purpose: item.value })}
          className="peer sr-only"
        />
        <span
          className={`flex min-h-14 items-center rounded-xl border-2 px-4 py-3 text-lg font-semibold transition-colors ${
            isSelected
              ? "border-accent bg-accent text-accent-ink"
              : "border-line-strong bg-surface text-slate-800 hover:bg-accent-soft"
          }`}
        >
          {t(item.labelKey)}
        </span>
      </label>
    );
  })}
</fieldset>

        {/* 2. How long */}
        <div className="space-y-2">
          <label id="stay-label" htmlFor="stay" className="block text-xl font-bold">
            {t("start.howLong")}
          </label>
          <Dropdown
            id="stay"
            labelledBy="stay-label"
            value={trip.stayMonths}
            options={MONTH_CHOICES.map((n) => ({ value: n, label: n === 1 ? t("start.month") : t("start.months", { n }) }))}
            onChange={(n) => update({ stayMonths: n })}
            className="sm:w-72"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* 3. When */}
        <div className="space-y-2">
          <p id="arrival-label" className="block text-xl font-bold">
            {t("start.when")}
          </p>
          <p id="arrival-help" className="text-lg text-muted">
            {t("start.whenHelp")}
          </p>
          {today && (
            <DatePicker
              id="arrival"
              focusRef={dateRef}
              value={trip.arrival}
              min={addDays(today, 1)}
              onChange={(day) => {
                update({ arrival: day });
                setError("");
              }}
              labelledBy="arrival-label"
              describedBy={error ? "arrival-help arrival-error" : "arrival-help"}
              invalid={!!error}
            />
          )}
          {error && (
            <p id="arrival-error" role="alert" className="text-lg font-semibold text-danger">
              {t(error === "needDate" ? "start.needDate" : error === "pastDate" ? "start.pastDate" : "trip.err.save")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink disabled:opacity-50"
          >
            {isSubmitting ? t("trip.saving") : t("start.make")}
            {!isSubmitting && <ArrowIcon className="h-6 w-6" />}
          </button>
          <Link
            href="/places"
            transitionTypes={BACK}
            data-button
            className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-line-strong bg-surface px-6 py-3 text-lg font-semibold hover:bg-accent-soft"
          >
            {t("start.back")}
          </Link>
        </div>
      </div>
    </form>
  );
}