"use client";

import { useRef } from "react";
import { STEP_BY_ID } from "@/content/steps";
import { useT } from "@/lib/i18n";
import { STEP_ORDER, type Journey, type StepId } from "@/lib/journey";
import { useSettings } from "@/lib/settings";
import { CheckIcon, PinIcon } from "./Icons";
import { StepDetails, type StepStatus } from "./StepDetails";

export interface OpenStep {
  id: StepId;
  /** Move focus into the details (on first open, or from "Show details"). */
  focus: boolean;
}

interface Props {
  journey: Journey;
  statusOf: (id: StepId) => StepStatus;
  open: OpenStep | null;
  onOpen: (open: OpenStep | null) => void;
  onToggleDone: (id: StepId) => void;
}

// Sideways sway of each stop, in units of --amp: a gentle S-curve like a trail.
const wind = (i: number) => Math.round(Math.sin((i * Math.PI) / 4) * 100) / 100;

/**
 * The roadmap as a winding trail of pill buttons. Picking a pill slides the
 * trail aside and opens that step's details next to it (or in its place on
 * narrow screens).
 */
export function RoadmapPath({ journey, statusOf, open, onOpen, onToggleDone }: Props) {
  const { t, lang } = useT();
  const [settings] = useSettings();
  const stageRef = useRef<HTMLDivElement>(null);
  const pills = useRef<Partial<Record<StepId, HTMLButtonElement | null>>>({});

  const narrow = () => (stageRef.current?.offsetWidth ?? 0) < 48 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  const scrollTo = (el: Element | null | undefined) =>
    el?.scrollIntoView({ behavior: settings.pauseMotion ? "auto" : "smooth", block: "start" });

  function pick(id: StepId) {
    if (open?.id === id) return;
    onOpen({ id, focus: !open });
    if (narrow()) requestAnimationFrame(() => scrollTo(stageRef.current));
  }

  function close() {
    const id = open?.id;
    onOpen(null);
    if (!id) return;
    requestAnimationFrame(() => {
      const pill = pills.current[id];
      pill?.focus({ preventScroll: true });
      if (narrow()) pill?.scrollIntoView({ block: "center" });
    });
  }

  const openPlan = open ? journey.steps.find((s) => s.id === open.id) : undefined;

  return (
    <div
      ref={stageRef}
      className="roadmap-stage"
      data-open={open ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) close();
      }}
    >
      <ol className="roadmap-path" aria-label={t("journey.roadmap")}>
        {STEP_ORDER.map((id, i) => {
          const status = statusOf(id);
          const here = wind(i);
          const next = i < STEP_ORDER.length - 1 ? wind(i + 1) : null;
          return (
            <li key={id} className="roadmap-stop" style={{ "--wind": here } as React.CSSProperties}>
              {status === "current" && (
                <p aria-hidden="true" className="mb-2 inline-flex items-center gap-1 rounded-full bg-warm px-3 py-0.5 text-sm font-bold text-warm-ink">
                  <PinIcon className="h-4 w-4" />
                  {t("status.current")}
                </p>
              )}
              <button
                ref={(el) => {
                  pills.current[id] = el;
                }}
                type="button"
                data-status={status}
                aria-expanded={open?.id === id}
                aria-controls={open?.id === id ? "step-details" : undefined}
                onClick={() => pick(id)}
                className="roadmap-pill"
              >
                {status === "done" && <CheckIcon className="h-5 w-5 shrink-0" />}
                <span>{STEP_BY_ID[id].text[lang].title}</span>
                <span className="sr-only">, {t(`status.${status}`)}</span>
              </button>
              {next !== null && (
                <span aria-hidden="true" className="roadmap-dots">
                  {[1, 2, 3].map((k) => (
                    <span key={k} style={{ "--shift": ((next - here) * k) / 4 } as React.CSSProperties} />
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {open && openPlan && (
        <div id="step-details" key={open.id} className="roadmap-panel">
          <StepDetails
            step={STEP_BY_ID[open.id]}
            plan={openPlan}
            status={statusOf(open.id)}
            interviewDate={journey.best.interviewDate}
            onToggleDone={() => onToggleDone(open.id)}
            onClose={close}
            autoFocus={open.focus}
          />
        </div>
      )}
    </div>
  );
}
