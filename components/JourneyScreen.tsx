"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserJourney, updateJourneyProgress, claimAnonymousJourney } from "@/app/actions/journey";
import { STEP_BY_ID } from "@/content/steps";
import { CONTENT_LAST_CHECKED } from "@/lib/config";
import { useToday } from "@/lib/clock";
import { useT } from "@/lib/i18n";
import { buildJourney, formatDate, STEP_ORDER, type StepId } from "@/lib/journey";
import { tripStore, useTrip } from "@/lib/trip";
import { useSettings } from "@/lib/settings";
import { ArrowIcon, PinIcon } from "./Icons";
import { FitPanel } from "./FitPanel";
import { RoadmapPath, type OpenStep } from "./RoadmapPath";
import type { StepStatus } from "./StepDetails";
import { BACK } from "./ScreenTransition";

export function JourneyScreen() {
  const { t, lang } = useT();
  const [trip] = useTrip();
  const [settings] = useSettings();
  const today = useToday();
  const [openStep, setOpenStep] = useState<OpenStep | null>(null);
  
  // Gatekeeper to prevent React infinite loops
  const hasSynced = useRef(false);
  
  // Auth0 User Session
  const { user } = useUser();

  const ready = Boolean(today && trip.arrival && trip.from === "IN" && trip.to === "US");

  const journey = useMemo(
    () => (ready ? buildJourney({ today, arrival: trip.arrival, stayMonths: trip.stayMonths }) : null),
    [ready, today, trip.arrival, trip.stayMonths],
  );

  // 1. Claim anonymous data, then fetch from Tiger Data
  useEffect(() => {
    // Only run if they are logged in AND we haven't synced yet
    if (user?.sub && !hasSynced.current) {
      hasSynced.current = true; // Lock the gate!

      const syncDatabase = async () => {
        // Step A: Claim any pre-login progress
        const tempId = localStorage.getItem("temp_journey_id");
        if (tempId) {
          await claimAnonymousJourney(tempId);
          localStorage.removeItem("temp_journey_id"); // Clean up
        }

        // Step B: Fetch the user's official data
        const data = await getUserJourney();
        if (data) {
          // Restore their complete profile AND their checkmarks
          tripStore.set({ 
            from: data.profile?.from || "IN",
            to: data.profile?.to || "US",
            arrival: data.profile?.arrival || "",
            stayMonths: data.profile?.stayMonths || 1,
            purpose: data.profile?.purpose || "family",
            done: data.stop_status || {} 
          });
        }
      };

      syncDatabase();
    }
  }, [user?.sub]); // <-- Depend on the string ID, not the object

  // 2. Save to Tiger Data when they click a step
  const handleToggleDone = async (id: StepId) => {
    const isNowDone = !trip.done[id];
    
    // Optimistic UI Update (instant feedback)
    tripStore.set({ done: { ...trip.done, [id]: isNowDone } });

    // Background Database Save
    if (user) {
      const stepIndex = STEP_ORDER.findIndex(step => step === id);
      await updateJourneyProgress(
        stepIndex + 1, 
        id, 
        isNowDone ? "completed" : "pending"
      );
    }
  };

  if (!journey) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("journey.title")}</h1>
        {today ? (
          <>
            <p className="text-xl">{t("journey.needInfo")}</p>
            <Link
              href="/start"
              transitionTypes={BACK}
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
    setOpenStep({ id, focus: true });
    requestAnimationFrame(() => {
      document
        .getElementById("roadmap-title")
        ?.scrollIntoView({ behavior: settings.pauseMotion ? "auto" : "smooth", block: "start" });
    });
  }

  // The details box is always open: on the step you picked, else the current one
  // (the last one once everything is done).
  const open: OpenStep = openStep ?? { id: currentId ?? STEP_ORDER[STEP_ORDER.length - 1], focus: false };

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
          <Link href="/start" transitionTypes={BACK} className="inline-flex min-h-12 items-center font-semibold text-accent underline">
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
        <RoadmapPath
          journey={journey}
          statusOf={statusOf}
          open={open}
          onOpen={setOpenStep}
          onToggleDone={handleToggleDone} 
        />
      </section>
    </div>
  );
}