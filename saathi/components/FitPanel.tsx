"use client";

import { LINKS } from "@/lib/config";
import { formatDate, WAIT_TIMES_AS_OF, type Fit, type Journey } from "@/lib/journey";
import { useT } from "@/lib/i18n";
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

/** Can the traveler arrive by their date? Plus the five U.S. offices compared. */
export function FitPanel({ journey }: { journey: Journey }) {
  const { t, lang } = useT();
  const best = journey.best;
  const bestName = t(`post.${best.id}`);

  return (
    <section aria-labelledby="fit-title" className="space-y-5 rounded-2xl border-2 border-line-strong bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="fit-title" className="text-2xl font-bold">
          {t("fit.heading", { date: formatDate(journey.arrival, lang) })}
        </h2>
        <FitBadge fit={best.fit} />
      </div>

      <p className="text-lg">
        {t(`fit.${best.fit}.msg`, {
          date: formatDate(best.interviewDate, lang),
          post: bestName,
          days: Math.abs(best.slackDays),
        })}
        {best.needsCheck && (
          <>
            {" "}
            <span className="inline-block rounded-full border-2 border-warm-ink bg-warm px-2 py-0.5 text-sm font-bold text-warm-ink">
              {t("fit.needsCheck")}
            </span>
          </>
        )}
      </p>
      <p className="text-lg font-semibold">{t("fit.bookBy", { date: formatDate(journey.bookDate, lang) })}</p>
      <p className="text-base text-muted">{t("fit.emergency")}</p>

      <div className="space-y-3">
        <h3 className="text-xl font-bold">{t("fit.compare")}</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {journey.posts.map((p, i) => (
            <li
              key={p.id}
              className={`space-y-2 rounded-xl border-2 p-4 ${i === 0 ? "border-accent" : "border-line-strong"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold">{t(`post.${p.id}`)}</p>
                <FitBadge fit={p.fit} />
              </div>
              <p className="text-base">{t("fit.wait", { n: p.waitMonths })}</p>
              <p className="text-base">{t("fit.interview", { date: formatDate(p.interviewDate, lang) })}</p>
              <div className="flex flex-wrap gap-2">
                {i === 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-sm font-bold text-accent-ink">
                    {t("fit.fastest")}
                  </span>
                )}
                {p.needsCheck && (
                  <span className="rounded-full border-2 border-warm-ink bg-warm px-2 py-0.5 text-sm font-bold text-warm-ink">
                    {t("fit.needsCheck")}
                  </span>
                )}
              </div>
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
          className="inline-flex items-center gap-1 font-semibold text-accent underline"
        >
          {t("fit.officialLink")}
          <ExternalIcon className="h-4 w-4" />
          <span className="sr-only">{t("journey.opensNewTab")}</span>
        </a>
      </p>
    </section>
  );
}
