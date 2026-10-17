"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addDays } from "@/lib/journey";
import { useToday } from "@/lib/clock";
import { RichText } from "./Glossary";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { ArrowIcon } from "./Icons";
import { DatePicker } from "./DatePicker";
import { BACK, FORWARD } from "./ScreenTransition";
import { createIntakeJourney } from "@/app/actions/journey";

const MONTH_CHOICES = [1, 2, 3, 4, 5, 6];

export function StartScreen() {
  const { t } = useT();
  const router = useRouter();
  const [trip] = useTrip();
  const update = tripStore.set;
  const today = useToday();
  const [error, setError] = useState<"" | "needDate" | "pastDate">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateRef = useRef<{ focus: () => void } | null>(null);

  const placesChosen = trip.from === "IN" && trip.to === "US";

  if (!placesChosen) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("start.title")}</h1>
        <p className="text-xl">{t("start.needPlaces")}</p>
        <Link
          href="/"
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

  function fillDemo() {
    // Sharda wants to arrive next summer for about four months.
    const now = new Date();
    const year = now.getMonth() > 5 ? now.getFullYear() + 1 : now.getFullYear();
    update({ from: "IN", to: "US", purpose: "family", stayMonths: 4, arrival: `${year}-07-01`, done: {} });
    setError("");
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

    try {
      // Create the row in Tiger Data
      const res = await createIntakeJourney();
      if (res?.id) {
        // Stash the UUID locally so Auth0 can claim it upon login
        localStorage.setItem("temp_journey_id", res.id);
      }
    } catch (err) {
      console.error("Database connection failed", err);
    }

    router.push("/journey", { transitionTypes: FORWARD });
  }

  return (
    // One centred column on narrow screens; on wide ones the questions sit on
    // the left and the date, buttons and demo on the right.
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto w-full max-w-2xl space-y-8 @5xl:grid @5xl:max-w-none @5xl:grid-cols-2 @5xl:items-start @5xl:gap-x-12 @5xl:space-y-0"
    >
      <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("start.title")}</h1>
        <p className="rounded-xl border-2 border-line-strong bg-accent-soft p-4 text-lg">{t("start.privacy")}</p>
        <p className="text-lg text-muted">
          <RichText text={t("start.visaNote")} />
        </p>
      </div>

      {/* 1. Why */}
      <fieldset className="space-y-3">
        <legend className="mb-1 text-xl font-bold">{t("start.why")}</legend>
        <label className="block cursor-pointer">
          <input type="radio" name="purpose" value="family" checked readOnly className="peer sr-only" />
          <span className="flex min-h-14 items-center rounded-xl border-2 border-accent bg-accent px-4 py-3 text-lg font-semibold text-accent-ink peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
            {t("start.why.family")}
          </span>
        </label>
        {(["study", "work"] as const).map((p) => (
          <label key={p} className="block">
            <input type="radio" name="purpose" disabled className="peer sr-only" />
            <span className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-dashed border-line-strong px-4 py-3 text-lg text-muted">
              <span>{t(p === "study" ? "start.why.study" : "start.why.work")}</span>
              <span className="text-base font-semibold">{t("home.comingSoon")}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {/* 2. How long */}
      <div className="space-y-2">
        <label htmlFor="stay" className="block text-xl font-bold">
          {t("start.howLong")}
        </label>
        <select
          id="stay"
          value={trip.stayMonths}
          onChange={(e) => update({ stayMonths: Number(e.target.value) })}
          className="min-h-14 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-3 text-lg font-semibold sm:w-72"
        >
          {MONTH_CHOICES.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? t("start.month") : t("start.months", { n })}
            </option>
          ))}
        </select>
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
            {t(error === "needDate" ? "start.needDate" : "start.pastDate")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : t("start.make")}
          {!isSubmitting && <ArrowIcon className="h-6 w-6" />}
        </button>
        <Link
          href="/"
          transitionTypes={BACK}
          data-button
          className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-line-strong bg-surface px-6 py-3 text-lg font-semibold hover:bg-accent-soft"
        >
          {t("start.back")}
        </Link>
      </div>

      <div className="border-t-2 border-line pt-6">
        <button
          type="button"
          onClick={fillDemo}
          className="min-h-12 rounded-xl border-2 border-dashed border-line-strong px-4 py-2 text-base font-semibold hover:bg-accent-soft"
        >
          {t("start.demo")}
        </button>
      </div>
      </div>
    </form>
  );
}