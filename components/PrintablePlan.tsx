"use client";

import { createPortal } from "react-dom";
import { DOCUMENTS } from "@/content/documents";
import { STEP_BY_ID } from "@/content/steps";
import { COUNTRY_BY_CODE, isOrigin } from "@/lib/countries";
import { useHome } from "@/lib/homeCountry";
import { useT } from "@/lib/i18n";
import { buildJourney, formatDate, WAIT_TIMES_BY_COUNTRY, type StepPlan } from "@/lib/journey";
import type { Trip } from "@/lib/trip";
import { plainText } from "./Glossary";

export type PrintProfile = Pick<
  Trip,
  "firstName" | "lastName" | "from" | "homeCity" | "homeAirport" | "to" | "destCity" | "destAirport" | "arrival" | "stayMonths" | "purpose"
>;

/**
 * The plan on one printed page: name and trip, then every step in order with
 * its dates, what to do and what to bring. Hidden on screen; when printing,
 * only this shows (see "Printing" in globals.css). Plain text only: no links,
 * buttons or nav. Takes the profile and done steps as props so the caregiver
 * view can print the traveler's plan too.
 */
export function PrintablePlan({ profile, done, today }: { profile: PrintProfile; done: Record<string, boolean>; today: string }) {
  const { t, lang } = useT();
  const home = isOrigin(profile.from) ? profile.from : "IN";
  const { loc } = useHome(home);
  if (!today || !profile.arrival || typeof document === "undefined") return null;

  const journey = buildJourney({
    today,
    arrival: profile.arrival,
    stayMonths: profile.stayMonths,
    visaType: profile.purpose || "family",
    waits: WAIT_TIMES_BY_COUNTRY[home],
  });
  const d = (iso: string) => formatDate(iso, lang);
  const name = `${profile.firstName} ${profile.lastName}`.trim();

  const when = (plan: StepPlan) => {
    if (plan.id === "arrive") return t("journey.arriveOn", { date: d(plan.start) });
    if (plan.id === "return") return t("journey.leaveBy", { date: d(plan.start) });
    if (plan.start === plan.end) return t("journey.onDate", { date: d(plan.start) });
    return t("journey.window", { start: d(plan.start), end: d(plan.end) });
  };

  // A direct child of <body>, so print CSS can hide everything else.
  return createPortal(
    <div className="printable-plan" aria-hidden="true">
      <h1 className="text-2xl font-bold">{name ? t("print.titleName", { name }) : t("print.title")}</h1>
      <p>
        {profile.homeCity} ({profile.homeAirport}), {t(COUNTRY_BY_CODE[home].nameKey)} → {profile.destCity} ({profile.destAirport}),{" "}
        {t(COUNTRY_BY_CODE[profile.to || "US"].nameKey)}
      </p>
      <p>
        {t("journey.arriveBy")}: <b>{d(journey.arrival)}</b> · {t("journey.stay")}:{" "}
        <b>{profile.stayMonths === 1 ? t("start.month") : t("start.months", { n: profile.stayMonths })}</b> · {t("start.why")}{" "}
        <b>{t(`start.why.${profile.purpose || "family"}`)}</b>
      </p>
      <p>
        {t("print.interview", { date: d(journey.best.interviewDate), office: t(`post.${journey.best.id}`) })} ·{" "}
        {t(`fit.${journey.best.fit}`)}
      </p>

      <ol className="printable-plan__steps">
        {journey.steps.map((plan, i) => {
          const step = loc(STEP_BY_ID[plan.id]);
          const text = step.text[lang];
          const docs = step.documents.map((id) => plainText(loc(DOCUMENTS[id]).name[lang]));
          return (
            <li key={plan.id}>
              <h2 className="font-bold">
                {i + 1}. {text.title}
                {done[plan.id] ? ` (${t("print.done")})` : ""}
              </h2>
              <p className="italic">
                {when(plan)}
                {plan.showsInterview ? ` · ${t("journey.interviewSlot", { date: d(journey.best.interviewDate) })}` : ""}
              </p>
              <ul>
                {text.what.map((w) => (
                  <li key={w}>{plainText(w)}</li>
                ))}
              </ul>
              {docs.length > 0 && (
                <p>
                  <b>{t("journey.documents")}:</b> {docs.join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="printable-plan__note">{t("print.note")}</p>
    </div>,
    document.body,
  );
}
