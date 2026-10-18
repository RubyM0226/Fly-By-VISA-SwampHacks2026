"use client";

import { ASSUMPTIONS, formatDate, type Journey } from "@/lib/journey";
import { useT } from "@/lib/i18n";

/**
 * Plain-language walk-through of the "days to spare / too late" math, using the
 * traveler's own dates. Was the "How did we work this out?" box on the
 * Dashboard; the Help page (/guide#plan-status) shows it.
 */
export function PlanMath({ journey }: { journey: Journey }) {
  const { t, lang } = useT();
  const best = journey.best;
  const A = ASSUMPTIONS;
  const d = (iso: string) => formatDate(iso, lang);
  const gap = Math.abs(best.slackDays);
  const days = gap === 1 ? t("fit.how.day") : t("fit.how.days", { n: gap });
  const months = best.waitMonths === 1 ? t("fit.how.month") : t("fit.how.months", { n: best.waitMonths });
  const late = best.slackDays < 0;

  return (
    <div className="space-y-4 text-lg leading-relaxed">
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
  );
}
