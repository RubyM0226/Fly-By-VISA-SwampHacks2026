"use client";

import { LINKS } from "@/lib/config";
import { ASSUMPTIONS, formatDate, WAIT_TIMES_AS_OF, type Fit, type Journey } from "@/lib/journey";
import { useT } from "@/lib/i18n";
import { useHome } from "@/lib/homeCountry";
import { AlertIcon, CheckIcon, ClockIcon, ExternalIcon } from "./Icons";

const FIT_STYLE: Record<Fit, string> = {
  onTrack: "border-accent bg-accent-soft text-accent",
  tight: "border-warm-ink bg-warm text-warm-ink",
  atRisk: "border-danger bg-danger-soft text-danger",
};

export function FitBadge({ fit }: { fit: Fit }) {
  const { t } = useT();
  const Icon = fit === "onTrack" ? CheckIcon : fit === "tight" ? ClockIcon : AlertIcon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-base font-bold ${FIT_STYLE[fit]}`}>
      <Icon className="h-5 w-5" />
      {t(`fit.${fit}`)}
    </span>
  );
}

/** Marks the office with the shortest wait. Also used on the Office Map, so both read the same. */
export function ShortestWaitBadge() {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-sm font-bold text-accent-ink">
      <ClockIcon className="h-4 w-4 shrink-0" />
      {t("fit.fastest")}
    </span>
  );
}

/** Can the traveler arrive by their date? Plus the five U.S. offices compared. */
export function FitPanel({ journey }: { journey: Journey }) {
  const { t, lang } = useT();
  const { name: homeName } = useHome();
  const best = journey.best;
  const bestName = t(`post.${best.id}`);

  return (
    <section aria-labelledby="fit-title" className="space-y-5 rounded-2xl border-2 border-line-strong bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="fit-title" className="text-2xl font-bold">
          {t("fit.yourDate", { date: formatDate(journey.arrival, lang) })}
        </h2>
        <FitBadge fit={best.fit} />
      </div>

      {/* One fact per line: label, then the value. */}
      <dl className="divide-y-2 divide-line rounded-xl border-2 border-line text-lg">
        <div className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[14rem_1fr]">
          <dt className="text-muted">{t("fit.earliest")}</dt>
          <dd className="font-bold">
            {formatDate(best.interviewDate, lang)}, {bestName}
          </dd>
        </div>
        <div className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[14rem_1fr]">
          <dt className="text-muted">{t(best.slackDays < 0 ? "fit.late" : "fit.spare")}</dt>
          <dd className={`font-bold ${best.slackDays < 0 ? "text-danger" : ""}`}>
            {Math.abs(best.slackDays) === 1 ? t("fit.aboutDay") : t("fit.aboutDays", { n: Math.abs(best.slackDays) })}
          </dd>
        </div>
        <div className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[14rem_1fr]">
          <dt className="text-muted">{t("fit.bookBy")}</dt>
          <dd className="font-bold">{formatDate(journey.bookDate, lang)}</dd>
        </div>
      </dl>

      <HowWeWorkedItOut journey={journey} />

      {best.fit !== "onTrack" && <p className="text-lg font-semibold">{t(`fit.${best.fit}.tip`)}</p>}
      <p className="text-base text-muted">{t("fit.emergency")}</p>

      <div className="space-y-3">
        <h3 className="text-xl font-bold">{t("fit.compare", { home: homeName })}</h3>
        <ul className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-5">
          {journey.posts.map((p, i) => (
            <li
              key={p.id}
              className={`space-y-2 rounded-xl border-2 p-4 ${i === 0 ? "border-accent" : "border-line-strong"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold">{t(`post.${p.id}`)}</p>
                <FitBadge fit={p.fit} />
              </div>
              <p className="text-base">{p.waitMonths === 1 ? t("fit.waitOne") : t("fit.wait", { n: p.waitMonths })}</p>
              <p className="text-base">{t("fit.interview", { date: formatDate(p.interviewDate, lang) })}</p>
              {i === 0 && (
                <div className="flex flex-wrap gap-2">
                  <ShortestWaitBadge />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-base text-muted">
        {t("fit.asOf", { date: formatDate(WAIT_TIMES_AS_OF, lang) })}{" "}
        <a
          href={LINKS.waitTimes}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-1 font-semibold text-accent underline"
        >
          {t("fit.officialLink")}
          <ExternalIcon className="h-4 w-4" />
          <span className="sr-only">{t("journey.opensNewTab")}</span>
        </a>
      </p>
    </section>
  );
}

/** Plain-language walk-through of the "days to spare / too late" math, using the traveler's own dates. */
function HowWeWorkedItOut({ journey }: { journey: Journey }) {
  const { t, lang } = useT();
  const best = journey.best;
  const A = ASSUMPTIONS;
  const d = (iso: string) => formatDate(iso, lang);
  const gap = Math.abs(best.slackDays);
  const days = gap === 1 ? t("fit.how.day") : t("fit.how.days", { n: gap });
  const months = best.waitMonths === 1 ? t("fit.how.month") : t("fit.how.months", { n: best.waitMonths });
  const late = best.slackDays < 0;

  return (
    <details className="rounded-xl border-2 border-line p-4">
      <summary className="min-h-12 cursor-pointer text-xl font-bold">{t("fit.how.title")}</summary>
      <div className="mt-3 space-y-4 text-lg leading-relaxed">
        <p>{t("fit.how.intro")}</p>
        <div>
          <h3 className="font-bold">{t("fit.how.s1.title")}</h3>
          <p>
            {t("fit.how.s1.body", {
              today: d(journey.today),
              book: A.daysUntilBooking,
              office: t(`post.${best.id}`),
              months,
              interview: d(best.interviewDate),
            })}
          </p>
        </div>
        <div>
          <h3 className="font-bold">{t("fit.how.s2.title")}</h3>
          <p>
            {t("fit.how.s2.body", {
              arrival: d(journey.arrival),
              visa: A.daysAfterInterviewForVisa,
              buffer: A.daysBeforeArrivalBuffer,
              total: A.daysAfterInterviewForVisa + A.daysBeforeArrivalBuffer,
              latest: d(best.latestInterviewDate),
            })}
          </p>
        </div>
        <div>
          <h3 className="font-bold">{t("fit.how.s3.title")}</h3>
          <p className={late ? "font-semibold text-danger" : ""}>
            {t(late ? "fit.how.s3.late" : "fit.how.s3.spare", {
              interview: d(best.interviewDate),
              latest: d(best.latestInterviewDate),
              days,
            })}
          </p>
        </div>
        <p>{t("fit.how.badge")}</p>
        <p className="text-base text-muted">{t("fit.how.note")}</p>
      </div>
    </details>
  );
}
