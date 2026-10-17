"use client";

import { useState } from "react";
import type { StepContent } from "@/content/steps";
import { formatDate, type StepPlan } from "@/lib/journey";
import { useT } from "@/lib/i18n";
import { plainText, RichText } from "./Glossary";
import { CheckIcon, ChevronIcon, ExternalIcon, PinIcon } from "./Icons";
import { SpeakButton } from "./SpeakButton";

export type StepStatus = "done" | "current" | "upcoming";

interface Props {
  step: StepContent;
  plan: StepPlan;
  number: number;
  status: StepStatus;
  isLast: boolean;
  interviewDate: string;
  open: boolean;
  onToggle: () => void;
  onToggleDone: () => void;
}

function Marker({ status, number }: { status: StepStatus; number: number }) {
  const base = "flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold";
  if (status === "done")
    return (
      <span className={`${base} border-accent bg-accent text-accent-ink`}>
        <CheckIcon className="h-6 w-6" />
      </span>
    );
  if (status === "current")
    return (
      <span className={`${base} pulse-ring border-accent bg-warm text-warm-ink`}>
        <PinIcon className="h-6 w-6" />
      </span>
    );
  return <span className={`${base} border-line-strong bg-surface text-ink`}>{number}</span>;
}

export function StepCard({ step, plan, number, status, isLast, interviewDate, open, onToggle, onToggleDone }: Props) {
  const { t, lang } = useT();
  const [simple, setSimple] = useState(false);
  const text = step.text[lang];
  const bodyId = `step-body-${step.id}`;

  let dateLine: string;
  if (step.id === "arrive") dateLine = t("journey.arriveOn", { date: formatDate(plan.start, lang) });
  else if (step.id === "return") dateLine = t("journey.leaveBy", { date: formatDate(plan.start, lang) });
  else if (plan.start === plan.end) dateLine = t("journey.onDate", { date: formatDate(plan.start, lang) });
  else
    dateLine = t("journey.window", {
      start: formatDate(plan.start, lang),
      end: formatDate(plan.end, lang),
    });

  const readText = simple
    ? `${text.title}. ${text.simple}`
    : `${text.title}. ${plainText(text.what)} ${plainText(text.why)} ${text.documents.map(plainText).join(", ")}.`;

  return (
    <li id={`step-${step.id}`} className="relative scroll-mt-4 pb-6 pl-16">
      <div className="absolute left-0 top-0">
        <Marker status={status} number={number} />
      </div>
      {!isLast && <span aria-hidden className="absolute bottom-0 left-6 top-12 w-0.5 bg-line-strong" />}

      <div className={`rounded-2xl border-2 bg-surface ${status === "current" ? "border-accent" : "border-line-strong"}`}>
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={onToggle}
            className="flex min-h-16 w-full items-start justify-between gap-3 rounded-2xl p-4 text-left"
          >
            <span className="space-y-1">
              <span className="block text-sm font-bold uppercase tracking-wide text-muted">
                {t(`status.${status}`)}
              </span>
              <span className="block text-xl font-bold">{text.title}</span>
              <span className="block text-base text-muted">{dateLine}</span>
            </span>
            <ChevronIcon className={`mt-2 h-6 w-6 shrink-0 ${open ? "rotate-180" : ""}`} />
          </button>
        </h3>

        {open && (
          <div id={bodyId} className="space-y-5 border-t-2 border-line p-4">
            {plan.showsInterview && (
              <p className="rounded-xl bg-warm p-3 text-lg font-semibold text-warm-ink">
                {t("journey.interviewSlot", { date: formatDate(interviewDate, lang) })}
              </p>
            )}

            {simple ? (
              <div className="rounded-xl border-2 border-accent bg-accent-soft p-4">
                <p className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">{t("journey.simpleTitle")}</p>
                <p className="text-xl">{text.simple}</p>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="mb-1 text-lg font-bold">{t("journey.whatToDo")}</h4>
                  <p className="text-lg">
                    <RichText text={text.what} />
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold">{t("journey.why")}</h4>
                  <p className="text-lg">
                    <RichText text={text.why} />
                  </p>
                </div>
              </>
            )}

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
              <button
                type="button"
                onClick={() => setSimple((s) => !s)}
                aria-pressed={simple}
                className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-lg font-semibold hover:bg-accent-soft"
              >
                {simple ? t("journey.showFull") : t("journey.explainSimply")}
              </button>
              <SpeakButton ownerId={`step-${step.id}`} label={t("journey.readStep")} getText={() => readText} />
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
