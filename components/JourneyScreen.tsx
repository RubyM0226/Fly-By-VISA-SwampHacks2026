"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserJourney, updateJourneyProgress, claimAnonymousJourney } from "@/app/actions/journey";
import { STEP_BY_ID } from "@/content/steps";
import { CONTENT_LAST_CHECKED, LINKS } from "@/lib/config";
import { useToday } from "@/lib/clock";
import { useT } from "@/lib/i18n";
import { buildJourney, formatDate, STEPS_BY_PURPOSE, WAIT_TIMES_BY_COUNTRY, type StepId, type VisaCategory } from "@/lib/journey";
import { tripStore, useTrip, type Trip } from "@/lib/trip";
import { doneFromStatus, tripFromProfile } from "@/lib/tripProfile";
import { COUNTRY_BY_CODE, isOrigin } from "@/lib/countries";
import { useSettings } from "@/lib/settings";
import { useHome } from "@/lib/homeCountry";
import { ArrowIcon, ExternalIcon, PinIcon } from "./Icons";
import { FitPanel } from "./FitPanel";
import { JourneyPrompts } from "./JourneyPrompts";
import { PrintablePlan } from "./PrintablePlan";
import { RoadmapPath, type OpenStep } from "./RoadmapPath";
import type { StepStatus } from "./StepDetails";
import { BACK } from "./ScreenTransition";

/** The traveler's Dashboard: their trip from this browser, synced with their account. */
export function JourneyScreen() {
  const [trip] = useTrip();

  // Gatekeeper to prevent React infinite loops
  const hasSynced = useRef(false);
  
  // Auth0 User Session
  const { user, isLoading: userLoading } = useUser();
  // Read only: decides whether to suggest signing in.
  const signedOut = !userLoading && !user;

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
          // Restore their complete profile, cities, airports AND their checkmarks
          tripStore.set({ ...tripFromProfile(data.profile), done: doneFromStatus(data.stop_status) });
        }
      };

      syncDatabase();
    }
  }, [user?.sub]); // <-- Depend on the string ID, not the object

 // Determine the dynamic step order based on visa type
  const stepOrder = STEPS_BY_PURPOSE[(trip.purpose as VisaCategory) || "family"];

  // 2. Save to Tiger Data when they click a step
  const handleToggleDone = async (id: StepId) => {
    const isNowDone = !trip.done[id];
    
    // Optimistic UI Update (instant feedback)
    tripStore.set({ done: { ...trip.done, [id]: isNowDone } });

    // Background Database Save
    if (user) {
      const stepIndex = stepOrder.findIndex(step => step === id);
      await updateJourneyProgress(
        stepIndex + 1, 
        id, 
        isNowDone ? "completed" : "pending"
      );
    }
  };

  // Signed-in users change answers on Account; signed-out users go back through the intake.
  const editHref = user ? "/account#trip-details" : "/start";

  return (
    <JourneyView
      trip={trip}
      own={{ onToggleDone: handleToggleDone, editHref, back: !user, signedOut }}
    />
  );
}

/** What only the traveler's own Dashboard has: editing, saving and the prompts. */
interface OwnControls {
  onToggleDone: (id: StepId) => void;
  editHref: string;
  /** Signed out: "Change my answers" goes back through the intake. */
  back: boolean;
  signedOut: boolean;
}

/**
 * The Dashboard itself. With `own` it is the traveler's; without, it is the
 * read-only copy a caregiver sees on a helper link (no editing, ticking,
 * marking done or prompts; Print instead of Change my answers).
 */
export function JourneyView({ trip, own }: { trip: Trip; own?: OwnControls }) {
  const { t, lang } = useT();
  const [settings] = useSettings();
  const today = useToday();
  const [openStep, setOpenStep] = useState<OpenStep | null>(null);
  const home = isOrigin(trip.from) ? trip.from : null;
  // The traveler's home country, not this browser's (a caregiver's may differ).
  const { loc } = useHome(home ?? undefined);
  const ready = Boolean(today && trip.arrival && home && trip.to === "US");

  const journey = useMemo(
    () =>
      ready && home
        ? buildJourney({
            today,
            arrival: trip.arrival,
            stayMonths: trip.stayMonths,
            visaType: (trip.purpose as VisaCategory) || "family",
            waits: WAIT_TIMES_BY_COUNTRY[home],
          })
        : null,
    [ready, home, today, trip.arrival, trip.stayMonths, trip.purpose],
  );
  const stepOrder = STEPS_BY_PURPOSE[(trip.purpose as VisaCategory) || "family"];

  if (!journey) {
    // A shared plan the traveler has not finished: nothing to show yet.
    if (!own) return <p className="text-xl">{t("helper.notReady")}</p>;
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("journey.title")}</h1>
        {today ? (
          <>
            <p className="text-xl">{t("journey.needInfo")}</p>
            <Link
              href={own.editHref}
              transitionTypes={own.back ? BACK : undefined}
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

  const currentId = stepOrder.find((id) => !trip.done[id]);
  const statusOf = (id: StepId): StepStatus => (trip.done[id] ? "done" : id === currentId ? "current" : "upcoming");

  function showStep(id: StepId) {
    setOpenStep({ id, focus: true });
    requestAnimationFrame(() => {
      document
        .getElementById("roadmap-title")
        ?.scrollIntoView({ behavior: settings.pauseMotion ? "auto" : "smooth", block: "start" });
    });
  }

  const currentPlan = currentId ? journey.steps.find((s) => s.id === currentId) : undefined;

  return (
    <div className="space-y-8">
      {/* The caregiver page has its own title (the traveler's name). */}
      {own ? (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold sm:text-4xl">{t("journey.title")}</h1>
          <p className="text-base text-muted">
            {t("journey.notice", { date: formatDate(CONTENT_LAST_CHECKED, lang) })}
          </p>
        </div>
      ) : (
        <p className="text-base text-muted">{t("journey.notice", { date: formatDate(CONTENT_LAST_CHECKED, lang) })}</p>
      )}

      <section
        aria-labelledby="trip-summary-title"
        className="flex flex-col gap-4 rounded-2xl border-2 border-line-strong bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="space-y-3">
          <h2 id="trip-summary-title" className="text-sm font-bold uppercase tracking-wide text-muted">
            {t("journey.tripTitle")}
          </h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-lg sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold text-muted">{t("trip.from")}</dt>
              <dd className="font-semibold">
                {trip.homeCity} ({trip.homeAirport}), {t(COUNTRY_BY_CODE[home!].nameKey)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">{t("trip.to")}</dt>
              <dd className="font-semibold">
                {trip.destCity} ({trip.destAirport}), {t(COUNTRY_BY_CODE[trip.to || "US"].nameKey)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">{t("journey.arriveBy")}</dt>
              <dd className="font-semibold">{formatDate(journey.arrival, lang)}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">{t("journey.stay")}</dt>
              <dd className="font-semibold">
                {trip.stayMonths === 1 ? t("start.month") : t("start.months", { n: trip.stayMonths })}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          {own && (
            <Link
              href={own.editHref}
              transitionTypes={own.back ? BACK : undefined}
              data-button
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-accent bg-surface px-6 py-3 text-xl font-bold text-accent hover:bg-hover"
            >
              {t("journey.edit")}
              <ArrowIcon className="h-6 w-6" />
            </Link>
          )}
          {/* Read-only: Print takes Change my answers' place, in its style. */}
          <button
            type="button"
            onClick={() => window.print()}
            className={
              own
                ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-6 py-2 text-lg font-semibold hover:bg-hover"
                : "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-accent bg-surface px-6 py-3 text-xl font-bold text-accent hover:bg-hover"
            }
          >
            {t("journey.print")}
          </button>
        </div>
      </section>

      <PrintablePlan profile={trip} done={trip.done} today={today} />
      {own && <JourneyPrompts journey={journey} signedOut={own.signedOut} editHref={own.editHref} />}

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
              <p className="text-lg">{loc(STEP_BY_ID[currentId].text[lang].simple)}</p>
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

      {/* FACT-CHECK: most UK citizens visiting for 90 days or less use the Visa Waiver Program (ESTA). */}
      {home === "GB" && trip.purpose === "family" && trip.stayMonths <= 3 && (
        <section role="note" aria-labelledby="esta-title" className="space-y-2 rounded-2xl border-2 border-accent bg-accent-soft p-5 sm:p-6">
          <p id="esta-title" className="text-xl font-bold">{t("esta.body")}</p>
          <p className="text-lg">{t("esta.more")}</p>
          <a
            href={LINKS.esta}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-1 text-lg font-semibold text-accent underline"
          >
            {t("esta.link")}
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">{t("journey.opensNewTab")}</span>
          </a>
        </section>
      )}

      <FitPanel journey={journey} home={home ?? undefined} />

      <section aria-labelledby="roadmap-title" className="space-y-4">
        <h2 id="roadmap-title" className="text-2xl font-bold">
          {t("journey.roadmap")}
        </h2>
        <RoadmapPath
          journey={journey}
          statusOf={statusOf}
          open={openStep ?? { id: currentId ?? stepOrder[0], focus: false }}
          onOpen={setOpenStep}
          onToggleDone={own?.onToggleDone}
          home={home ?? undefined}
        />
      </section>
    </div>
  );
}