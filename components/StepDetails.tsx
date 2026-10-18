"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DOCUMENTS } from "@/content/documents";
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
  /** Move focus to the heading when shown (keyboard and screen-reader users land here). */
  autoFocus: boolean;
}

/** Everything about one step, shown beside the roadmap when its pill is picked. */
export function StepDetails({ step, plan, status, interviewDate, onToggleDone, autoFocus }: Props) {
  const { t, lang } = useT();
  const text = step.text[lang];
  const documents = step.documents.map((id) => DOCUMENTS[id]);
  const hasUploads = documents.some((d) => d.upload);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set only by pressing "Mark as done" here, so the stamp thumps down once
  // then, and not when an already-done step is opened.
  const [justStamped, setJustStamped] = useState(false);

  function toggleDone() {
    const markingDone = status !== "done";
    setJustStamped(markingDone);
    onToggleDone();
  }

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
    `${t("journey.documents")}: ${documents.map((d) => plainText(d.name[lang])).join(", ")}.`,
    text.cost && `${t("journey.cost")}: ${plainText(text.cost)}`,
    text.time && `${t("journey.time")}: ${plainText(text.time)}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      aria-labelledby={`step-title-${step.id}`}
      className={`rounded-2xl border-2 bg-surface ${status === "current" ? "border-accent" : "border-line-strong"}`}
    >
      <div className="space-y-3 border-b-2 border-line p-4">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
            {status === "current" && <PinIcon className="h-5 w-5" />}
            {status === "done" && <CheckIcon className="h-5 w-5" />}
            {t(`status.${status}`)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`step-title-${step.id}`} ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
              {text.title}
            </h3>
            <SpeakButton ownerId={`step-${step.id}`} getText={() => readText} />
            {/* Decorative: the status line above already says "Done" in words. */}
            {status === "done" && (
              <span aria-hidden="true" className="done-stamp ml-auto" data-animate={justStamped || undefined}>
                <CheckIcon className="h-5 w-5 shrink-0" />
                {t("journey.stamp")}
              </span>
            )}
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
        {(step.action || hasUploads) && (
          <div className="flex flex-wrap gap-3">
            {step.action && (
              <Link
                href={step.action.href}
                className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
              >
                {step.action.label[lang]}
                <ArrowIcon className="h-6 w-6" />
              </Link>
            )}
            {hasUploads && (
              <Link
                href={`/documents#docs-${step.id}`}
                className="inline-flex min-h-14 items-center text-xl font-semibold text-accent underline"
              >
                {t("journey.viewDocuments")}
              </Link>
            )}
          </div>
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
            {step.documents.map((id) => (
              <li key={id}>
                <RichText text={DOCUMENTS[id].name[lang]} />
              </li>
            ))}
          </ul>
        </div>

        {(text.cost || text.time) && (
          <dl className="grid gap-3 text-lg sm:grid-cols-2">
            {text.cost && (
              <div>
                <dt className="font-bold">{t("journey.cost")}</dt>
                <dd>
                  <RichText text={text.cost} />
                </dd>
              </div>
            )}
            {text.time && (
              <div>
                <dt className="font-bold">{t("journey.time")}</dt>
                <dd>
                  <RichText text={text.time} />
                </dd>
              </div>
            )}
          </dl>
        )}

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
            onClick={toggleDone}
            className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-2 text-lg font-bold ${
              status === "done"
                ? "border-2 border-line-strong bg-surface text-ink hover:bg-accent-soft"
                : "bg-accent text-accent-ink"
            }`}
          >
            {status !== "done" && <CheckIcon className="h-5 w-5" />}
            {status === "done" ? t("journey.undo") : t("journey.markDone")}
          </button>
          <p role="status" className="sr-only">
            {status === "done" && justStamped ? t("journey.markedDone") : ""}
          </p>
        </div>
      </div>
    </article>
  );
}
