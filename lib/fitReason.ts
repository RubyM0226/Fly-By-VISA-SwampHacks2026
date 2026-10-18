import { formatDate, type PostResult } from "./journey";
import type { UiKey, Vars } from "./i18n";
import type { Lang } from "./settings";

type Translate = (key: UiKey, vars?: Vars) => string;

/** Why an office got its On track / Tight / At risk badge, in one sentence from its own numbers. */
export function fitReason(t: Translate, lang: Lang, post: PostResult): string {
  const latest = formatDate(post.latestInterviewDate, lang);
  if (post.slackDays === 0) return t("fit.reason.sameDay", { latest });
  const n = Math.abs(post.slackDays);
  return t(`fit.reason.${post.fit}`, { days: n === 1 ? t("fit.how.day") : t("fit.how.days", { n }), latest });
}
