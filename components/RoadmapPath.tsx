"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { STEP_BY_ID } from "@/content/steps";
import { useT } from "@/lib/i18n";
import { STEPS_BY_PURPOSE, type Journey, type StepId } from "@/lib/journey";import { ArrowIcon, CheckIcon, PinIcon } from "./Icons";
import { StepDetails, type StepStatus } from "./StepDetails";

export interface OpenStep {
  id: StepId;
  /** Move focus into the details (on first open, or from "Show details"). */
  focus: boolean;
}

interface Props {
  journey: Journey;
  statusOf: (id: StepId) => StepStatus;
  open: OpenStep;
  onOpen: (open: OpenStep) => void;
  onToggleDone: (id: StepId) => void;
}

/**
 * The roadmap as a horizontal carousel of pills joined by a line. The current
 * step starts in the middle; arrows, swiping or picking a pill moves along.
 * Picking a pill centres it and opens its details below.
 */
export function RoadmapPath({ journey, statusOf, open, onOpen, onToggleDone }: Props) {
  const stepOrder = STEPS_BY_PURPOSE[journey.visaType];
  const { t, lang } = useT();
  const trackRef = useRef<HTMLOListElement>(null);
  const [centered, setCentered] = useState(0);

  const currentIndex = Math.max(
    0,
    stepOrder.findIndex((id) => statusOf(id) === "current"),
  );

  // Where a smooth scroll is heading, so quick arrow presses keep moving on
  // instead of reading a position that is still on its way.
  const target = useRef<number | null>(null);

  // Scroll so step i sits in the middle. The track's CSS decides smooth or
  // instant (instant when motion is reduced).
  const center = useCallback((i: number, instant = false) => {
    const track = trackRef.current;
    const stop = track?.children[i] as HTMLElement | undefined;
    if (!track || !stop) return;
    const left = stop.offsetLeft + stop.offsetWidth / 2 - track.clientWidth / 2;
    // Already there: no scroll will happen, so nothing to wait for.
    target.current = instant || Math.abs(track.scrollLeft - left) < 1 ? null : i;
    setCentered(i);
    track.scrollTo({ left, behavior: instant ? "instant" : undefined });
  }, []);

  // Start with the current step in the middle (only on first show; after
  // that, where the strip sits is up to the user).
  const startIndex = useRef(currentIndex);
  useLayoutEffect(() => {
    center(startIndex.current, true);
    setCentered(startIndex.current);
  }, [center]);

  // Opening a step (from a pill or "Show details") brings it to the middle.
  const openId = open.id;
  useEffect(() => {
    center(stepOrder.indexOf(openId));
  }, [openId, center]);

  // Keep track of which step is in the middle, for the arrows. While an arrow
  // or pick is scrolling, keep its destination until the scroll settles.
  function onScroll() {
    const track = trackRef.current;
    if (!track || target.current !== null) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((el, i) => {
      const s = el as HTMLElement;
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setCentered(best);
  }

  function pick(id: StepId) {
    if (open.id === id) {
      center(stepOrder.indexOf(id));
      return;
    }
    onOpen({ id, focus: false });
  }

  const openPlan = journey.steps.find((s) => s.id === open.id);
  const last = stepOrder.length - 1;

  return (
    <div>
      <div className="roadmap-carousel">
        <button
          type="button"
          data-side="left"
          className="roadmap-arrow"
          aria-label={t("journey.earlier")}
          disabled={centered <= 0}
          onClick={() => center(Math.max(0, (target.current ?? centered) - 1))}
        >
          <ArrowIcon className="h-6 w-6 rotate-180" />
        </button>

        <ol
          ref={trackRef}
          className="roadmap-track"
          aria-label={t("journey.roadmap")}
          onScroll={onScroll}
          onScrollEnd={() => {
            target.current = null;
            onScroll();
          }}
        >
          {stepOrder.map((id, i) => {
            const status = statusOf(id);
            return (
              <li key={id} className="roadmap-stop" data-status={status}>
                <div className="roadmap-tag-slot">
                  {status === "current" && (
                    <p aria-hidden="true" className="mb-2 inline-flex items-center gap-1 rounded-full bg-warm px-3 py-0.5 text-sm font-bold text-warm-ink">
                      <PinIcon className="h-4 w-4" />
                      {t("status.current")}
                    </p>
                  )}
                </div>
                <div className="roadmap-pill-row">
                  <button
                    type="button"
                    data-status={status}
                    aria-expanded={open.id === id}
                    aria-controls={open.id === id ? "step-details" : undefined}
                    onClick={() => pick(id)}
                    onFocus={() => center(i)}
                    className="roadmap-pill"
                  >
                    {status === "done" && <CheckIcon className="h-5 w-5 shrink-0" />}
                    <span>{STEP_BY_ID[id].text[lang].pill}</span>
                    <span className="sr-only">, {t(`status.${status}`)}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          data-side="right"
          className="roadmap-arrow"
          aria-label={t("journey.later")}
          disabled={centered >= last}
          onClick={() => center(Math.min(last, (target.current ?? centered) + 1))}
        >
          <ArrowIcon className="h-6 w-6" />
        </button>
      </div>

      {openPlan && (
        <div id="step-details" key={open.id} className="roadmap-panel">
          <StepDetails
            step={STEP_BY_ID[open.id]}
            plan={openPlan}
            status={statusOf(open.id)}
            interviewDate={journey.best.interviewDate}
            onToggleDone={() => onToggleDone(open.id)}
            earlierUndone={stepOrder.slice(0, stepOrder.indexOf(open.id)).some((id) => statusOf(id) !== "done")}
            autoFocus={open.focus}
          />
        </div>
      )}
    </div>
  );
}
