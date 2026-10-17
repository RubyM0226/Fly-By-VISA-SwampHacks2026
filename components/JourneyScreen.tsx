"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STEP_BY_ID } from "@/content/steps";
import { CONTENT_LAST_CHECKED } from "@/lib/config";
import { useToday } from "@/lib/clock";
import { useT } from "@/lib/i18n";
import { buildJourney, formatDate, STEP_ORDER, type StepId } from "@/lib/journey";
import { tripStore, useTrip } from "@/lib/trip";
import { useSettings } from "@/lib/settings";
import { ArrowIcon, PinIcon } from "./Icons";
import { FitPanel } from "./FitPanel";
import { StepCard, type StepStatus } from "./StepCard";

export function JourneyScreen() {
  const { t, lang } = useT();
  const [trip] = useTrip();
  const [settings] = useSettings();
  const today = useToday();
  const [openId, setOpenId] = useState<StepId | null>(null);

  const ready = Boolean(today && trip.arrival && trip.from === "IN" && trip.to === "US");

  const journey = useMemo(
    () => (ready ? buildJourney({ today, arrival: trip.arrival, stayMonths: trip.stayMonths }) : null),
    [ready, today, trip.arrival, trip.stayMonths],
  );

  if (!journey) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("journey.title")}</h1>
        {today ? (
          <>
            <p className="text-xl">{t("journey.needInfo")}</p>
            <Link
              href="/start"
              data-button
              className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
            >
              {t("journey.needInfoLink")}
              <ArrowIcon className="h-6 w-6" />
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  const currentId = STEP_ORDER.find((id) => !trip.done[id]);
  const statusOf = (id: StepId): StepStatus => (trip.done[id] ? "done" : id === currentId ? "current" : "upcoming");

  function showStep(id: StepId) {
    setOpenId(id);
    requestAnimationFrame(() => {
      document
        .getElementById(`step-${id}`)
        ?.scrollIntoView({ behavior: settings.pauseMotion ? "auto" : "smooth", block: "start" });
    });
  }

  const currentPlan = currentId ? journey.steps.find((s) => s.id === currentId) : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("journey.title")}</h1>
        <p className="text-xl text-muted">
          {t("journey.summary", { date: formatDate(journey.arrival, lang), n: trip.stayMonths })}
        </p>
        <p className="text-base text-muted">
          {t("journey.notice", { date: formatDate(CONTENT_LAST_CHECKED, lang) })}{" "}
          <Link href="/start" className="inline-flex min-h-12 items-center font-semibold text-accent underline">
            {t("journey.edit")}
          </Link>
        </p>
      </div>

      {/* One sentence, one big button: always a way forward. */}
      <section
        aria-labelledby="next-title"
        className="flex flex-col gap-4 rounded-2xl border-2 border-accent bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="space-y-1">
          <h2 id="next-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <PinIcon className="h-5 w-5" />
            {t("journey.next")}
          </h2>
          {currentId && currentPlan ? (
            <>
              <p className="text-2xl font-bold">{STEP_BY_ID[currentId].text[lang].title}</p>
              <p className="text-lg">{STEP_BY_ID[currentId].text[lang].simple}</p>
            </>
          ) : (
            <p className="text-2xl font-bold">{t("journey.allDone")}</p>
          )}
        </div>
        {currentId && (
          <button
            type="button"
            onClick={() => showStep(currentId)}
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
          >
            {t("journey.showDetails")}
            <ArrowIcon className="h-6 w-6" />
          </button>
        )}
      </section>

      <FitPanel journey={journey} />

      <section aria-labelledby="roadmap-title" className="space-y-4">
        <h2 id="roadmap-title" className="text-2xl font-bold">
          {t("journey.roadmap")}
        </h2>
        <ol>
          {STEP_ORDER.map((id, i) => {
            const plan = journey.steps.find((s) => s.id === id)!;
            return (
              <StepCard
                key={id}
                step={STEP_BY_ID[id]}
                plan={plan}
                number={i + 1}
                status={statusOf(id)}
                isLast={i === STEP_ORDER.length - 1}
                interviewDate={journey.best.interviewDate}
                open={openId === id}
                onToggle={() => setOpenId(openId === id ? null : id)}
                onToggleDone={() => tripStore.set({ done: { ...trip.done, [id]: !trip.done[id] } })}
              />
            );
          })}
        </ol>
      </section>
    </div>
  );
}
