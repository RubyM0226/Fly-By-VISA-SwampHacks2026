"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { StepContent } from "@/content/steps";
import { formatDate, type StepPlan } from "@/lib/journey";
import { useT } from "@/lib/i18n";
import { plainText, RichText } from "./Glossary";
import { ArrowIcon, CheckIcon, ExternalIcon, PinIcon } from "./Icons";
import { SpeakButton } from "./SpeakButton";

export type StepStatus = "done" | "current" | "upcoming";

interface Props {
  step: StepContent;
  plan: StepPlan;
  status: StepStatus;
  interviewDate: string;
  onToggleDone: () => void;
  onClose: () => void;
  /** Move focus to the heading when shown (keyboard and screen-reader users land here). */
  autoFocus: boolean;
}

/** Everything about one step, shown beside the roadmap when its pill is picked. */
export function StepDetails({ step, plan, status, interviewDate, onToggleDone, onClose, autoFocus }: Props) {
  const { t, lang } = useT();
  const text = step.text[lang];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus({ preventScroll: true });
  }, [autoFocus, step.id]);

  let dateLine: string;
  if (step.id === "arrive") dateLine = t("journey.arriveOn", { date: formatDate(plan.start, lang) });
  else if (step.id === "return") dateLine = t("journey.leaveBy", { date: formatDate(plan.start, lang) });
  else if (plan.start === plan.end) dateLine = t("journey.onDate", { date: formatDate(plan.start, lang) });
  else
    dateLine = t("journey.window", {
      start: formatDate(plan.start, lang),
      end: formatDate(plan.end, lang),
    });

  const readText = [
    `${text.title}.`,
    ...text.what.map(plainText),
    `${t("journey.documents")}: ${text.documents.map(plainText).join(", ")}.`,
    `${t("journey.cost")}: ${plainText(text.cost)}`,
    `${t("journey.time")}: ${plainText(text.time)}.`,
  ].join(" ");

  return (
    <article
      aria-labelledby={`step-title-${step.id}`}
      className={`rounded-2xl border-2 bg-surface ${status === "current" ? "border-accent" : "border-line-strong"}`}
    >
      <div className="space-y-3 border-b-2 border-line p-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-accent-soft"
        >
          <ArrowIcon className="h-5 w-5 rotate-180" />
          {t("journey.backToMap")}
        </button>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
            {status === "current" && <PinIcon className="h-5 w-5" />}
            {status === "done" && <CheckIcon className="h-5 w-5" />}
            {t(`status.${status}`)}
          </p>
          <div className="flex items-center gap-2">
            <h3 id={`step-title-${step.id}`} ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
              {text.title}
            </h3>
            <SpeakButton ownerId={`step-${step.id}`} getText={() => readText} />
          </div>
          <p className="text-base text-muted">{dateLine}</p>
        </div>
      </div>

      <div className="space-y-5 p-4">
        {plan.showsInterview && (
          <p className="rounded-xl bg-warm p-3 text-lg font-semibold text-warm-ink">
            {t("journey.interviewSlot", { date: formatDate(interviewDate, lang) })}
          </p>
        )}
        {step.action && (
          <Link
            href={step.action.href}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
          >
            {step.action.label[lang]}
            <ArrowIcon className="h-6 w-6" />
          </Link>
        )}

        <div>
          <h4 className="mb-1 text-lg font-bold">{t("journey.whatToDo")}</h4>
          <ul className="list-disc space-y-1 pl-6 text-lg">
            {text.what.map((line) => (
              <li key={line}>
                <RichText text={line} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-1 text-lg font-bold">{t("journey.documents")}</h4>
          <ul className="list-disc space-y-1 pl-6 text-lg">
            {text.documents.map((d) => (
              <li key={d}>
                <RichText text={d} />
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-3 text-lg sm:grid-cols-2">
          <div>
            <dt className="font-bold">{t("journey.cost")}</dt>
            <dd>
              <RichText text={text.cost} />
            </dd>
          </div>
          <div>
            <dt className="font-bold">{t("journey.time")}</dt>
            <dd>
              <RichText text={text.time} />
            </dd>
          </div>
        </dl>

        <div>
          <h4 className="mb-1 text-lg font-bold">{t("journey.links")}</h4>
          <ul className="space-y-1">
            {step.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 text-lg font-semibold text-accent underline"
                >
                  {l.label[lang]}
                  <ExternalIcon className="h-4 w-4" />
                  <span className="sr-only">{t("journey.opensNewTab")}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 border-t-2 border-line pt-4">
          <button
            type="button"
            onClick={onToggleDone}
            className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-2 text-lg font-bold ${
              status === "done"
                ? "border-2 border-line-strong bg-surface text-ink hover:bg-accent-soft"
                : "bg-accent text-accent-ink"
            }`}
          >
            {status !== "done" && <CheckIcon className="h-5 w-5" />}
            {status === "done" ? t("journey.undo") : t("journey.markDone")}
          </button>
        </div>
      </div>
    </article>
  );
}
