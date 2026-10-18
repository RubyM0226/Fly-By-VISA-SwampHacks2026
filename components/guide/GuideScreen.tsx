"use client";

import { useEffect, useMemo } from "react";
import { useToday } from "@/lib/clock";
import { isOrigin } from "@/lib/countries";
import { sharedTrip, type SharedJourney } from "@/lib/helperView";
import { useT, type UiKey } from "@/lib/i18n";
import { addDays, buildJourney, WAIT_TIMES_BY_COUNTRY, type VisaCategory } from "@/lib/journey";
import { useTrip, type Trip } from "@/lib/trip";
import { PlanMath } from "../PlanMath";
import {
  AccountGraphic,
  ContactGraphic,
  DashboardGraphic,
  DocumentsGraphic,
  FlightsGraphic,
  LandingGraphic,
  LookupGraphic,
  OfficeMapGraphic,
  PlacesGraphic,
  PlanStatusGraphic,
  RoadmapGraphic,
  ScamCheckGraphic,
  SettingsGraphic,
  StartGraphic,
  TerminologyGraphic,
} from "./Graphics";

interface Section {
  id: string;
  /** guide.section.<key>.title and .intro */
  key: string;
  body: React.ReactNode;
}

/** The trip's journey, or null when the trip is not complete. */
function journeyOf(trip: Trip, today: string) {
  if (!today || !trip.arrival || !isOrigin(trip.from) || trip.to !== "US") return null;
  return buildJourney({
    today,
    arrival: trip.arrival,
    stayMonths: trip.stayMonths,
    visaType: (trip.purpose as VisaCategory) || "family",
    waits: WAIT_TIMES_BY_COUNTRY[trip.from],
  });
}

/**
 * "Understanding your plan status": the math with the user's own dates (this
 * browser's trip, or the shared journey for a caregiver), or a worked example.
 */
function PlanStatusBody({ shared }: { shared?: SharedJourney }) {
  const { t } = useT();
  const [ownTrip] = useTrip();
  const today = useToday();
  const trip = shared ? sharedTrip(shared) : ownTrip;
  const real = useMemo(() => journeyOf(trip, today), [trip, today]);
  // Sample: from India, arriving about nine months from today.
  const example = useMemo(
    () => (today ? buildJourney({ today, arrival: addDays(today, 270), stayMonths: 2, waits: WAIT_TIMES_BY_COUNTRY.IN }) : null),
    [today],
  );
  const journey = real ?? example;
  return (
    <div className="space-y-6">
      <PlanStatusGraphic />
      {journey && (
        <div className="space-y-3 rounded-2xl border-2 border-line-strong bg-surface p-5 sm:p-6">
          <h3 className="text-xl font-bold">{t(real ? (shared ? "guide.planStatus.theirs" : "guide.planStatus.yours") : "guide.planStatus.example")}</h3>
          <PlanMath journey={journey} />
        </div>
      )}
    </div>
  );
}

/**
 * The Help page: a walkthrough of every page, in the order people use them.
 * `shared` (caregiver on a helper link): only what a caregiver can use.
 */
export function GuideScreen({ shared }: { shared?: SharedJourney }) {
  const { t } = useT();

  const sections: Section[] = shared
    ? [
        { id: "shared-plan", key: "sharedPlan", body: <DashboardGraphic shared /> },
        { id: "plan-status", key: "planStatus", body: <PlanStatusBody shared={shared} /> },
        { id: "documents", key: "sharedDocs", body: <DocumentsGraphic shared /> },
        { id: "contact", key: "contact", body: <ContactGraphic /> },
        { id: "settings", key: "settings", body: <SettingsGraphic /> },
      ]
    : [
        {
          id: "getting-started",
          key: "start",
          body: (
            <div className="space-y-8">
              <LandingGraphic />
              <PlacesGraphic />
            </div>
          ),
        },
        { id: "your-trip", key: "trip", body: <StartGraphic /> },
        {
          id: "roadmap",
          key: "roadmap",
          body: (
            <div className="space-y-8">
              <DashboardGraphic />
              <RoadmapGraphic />
            </div>
          ),
        },
        { id: "plan-status", key: "planStatus", body: <PlanStatusBody /> },
        { id: "documents", key: "documents", body: <DocumentsGraphic /> },
        { id: "flights", key: "flights", body: <FlightsGraphic /> },
        { id: "office-map", key: "map", body: <OfficeMapGraphic /> },
        { id: "scam-check", key: "scam", body: <ScamCheckGraphic /> },
        { id: "terminology", key: "terms", body: <TerminologyGraphic /> },
        { id: "information-lookup", key: "lookup", body: <LookupGraphic /> },
        { id: "account", key: "account", body: <AccountGraphic /> },
        { id: "settings", key: "settings", body: <SettingsGraphic /> },
      ];

  // Arriving at /guide#plan-status (the Dashboard's "How did we work this
  // out?"), or following a contents link: bring that heading below the sticky
  // header (html's scroll-padding-top) and move keyboard focus to it.
  useEffect(() => {
    function goToHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const heading = id ? document.getElementById(`${id}-title`) : null;
      if (!heading) return;
      // After this frame, so content that renders on the client is in place.
      requestAnimationFrame(() => {
        heading.scrollIntoView({ block: "start" });
        heading.focus({ preventScroll: true });
      });
    }
    goToHash();
    window.addEventListener("hashchange", goToHash);
    return () => window.removeEventListener("hashchange", goToHash);
  }, []);

  const title = (key: string) => t(`guide.section.${key}.title` as UiKey);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("guide.title")}</h1>
        <p className="text-lg">{t(shared ? "guide.leadShared" : "guide.lead")}</p>
      </div>

      <nav aria-labelledby="guide-contents" className="@container rounded-2xl border-2 border-line-strong bg-surface p-5">
        <h2 id="guide-contents" className="mb-2 text-xl font-bold">
          {t("guide.contents")}
        </h2>
        <ol className="grid list-decimal gap-x-8 pl-6 text-lg @xl:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">
                {title(s.key)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="space-y-4">
          <h2 id={`${s.id}-title`} tabIndex={-1} className="text-2xl font-bold outline-none sm:text-3xl">
            {title(s.key)}
          </h2>
          <p className="text-lg">{t(`guide.section.${s.key}.intro` as UiKey)}</p>
          {s.body}
        </section>
      ))}
    </div>
  );
}
