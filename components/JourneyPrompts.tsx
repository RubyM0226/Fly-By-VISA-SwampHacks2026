"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { fitReason } from "@/lib/fitReason";
import { useT } from "@/lib/i18n";
import type { Journey } from "@/lib/journey";
import { BACK } from "./ScreenTransition";

// "Skip" is remembered for this browser session only. The dates prompt is
// keyed by the arrival date, so choosing a new date can prompt again.
const SKIP_SIGN_IN = "flybyvisa:skip-sign-in";
const skipDatesKey = (arrival: string) => `flybyvisa:skip-dates:${arrival}`;

const noopSubscribe = () => () => {};
function readSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false; // storage blocked: just ask again next time
  }
}
function writeSession(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage blocked */
  }
}
/** True once skipped this session. On the server it is true, so nothing opens before hydration. */
function useSkipped(key: string): boolean {
  return useSyncExternalStore(noopSubscribe, () => readSession(key), () => true);
}
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/**
 * Resolves once no page transition is running. View-transition snapshots draw
 * above the top layer, so a dialog opened mid-slide sits under the incoming
 * page (its badges and cards) until the slide ends. One frame first: React
 * runs effects before the browser has started the transition's animations.
 */
async function afterViewTransitions() {
  await new Promise((r) => requestAnimationFrame(r));
  const active = (document as Document & { activeViewTransition?: { finished: Promise<void> } }).activeViewTransition;
  const running = document
    .getAnimations()
    .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.startsWith("::view-transition"))
    .map((a) => a.finished);
  await Promise.allSettled([active?.finished, ...running]);
}

/** Always ends modal (top layer), never plain `open`, which stacks like a normal box. */
function openModal(dialog: HTMLDialogElement) {
  if (!dialog.isConnected) return;
  // Open but not modal: drop it without firing "close" (which would count as Skip), then reopen modal.
  if (dialog.open && !dialog.matches(":modal")) dialog.removeAttribute("open");
  if (!dialog.open) dialog.showModal();
}

const primary =
  "inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink";
const secondary =
  "inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-line-strong bg-surface px-6 py-2 text-lg font-semibold hover:bg-hover";

/**
 * Dashboard prompts, one at a time: first "change my dates" when the plan is
 * Tight or At risk, then (signed out) "sign in to save your plan". Each is a
 * native dialog, so focus is trapped and Escape closes it; any close counts
 * as Skip.
 */
export function JourneyPrompts({ journey, signedOut, editHref }: { journey: Journey; signedOut: boolean; editHref: string }) {
  const { t, lang } = useT();
  const best = journey.best;
  const datesKey = skipDatesKey(journey.arrival);
  const datesSkipped = useSkipped(datesKey);
  const signInSkipped = useSkipped(SKIP_SIGN_IN);
  // Closed in this visit; sessionStorage remembers it for the next one.
  const [closed, setClosed] = useState<string[]>([]);

  const showDates = best.fit !== "onTrack" && !datesSkipped && !closed.includes(datesKey);
  const showSignIn = signedOut && !signInSkipped && !closed.includes(SKIP_SIGN_IN);
  const current = showDates ? datesKey : showSignIn ? SKIP_SIGN_IN : null;

  const hydrated = useHydrated();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!current) {
      if (dialog.open) dialog.close();
      return;
    }
    // Cancelled on re-run (Strict Mode, or the prompt changed while waiting).
    let cancelled = false;
    afterViewTransitions().then(() => {
      if (!cancelled) openModal(dialog);
    });
    return () => {
      cancelled = true;
    };
  }, [current, hydrated]);

  // The one place a prompt is dismissed: the dialog's close event, from
  // Escape, Skip or following a link. Any close counts as Skip.
  function skip() {
    if (!current) return;
    writeSession(current);
    setClosed((c) => (c.includes(current) ? c : [...c, current]));
  }
  const close = () => dialogRef.current?.close();

  if (!hydrated) return null;
  // At the end of <body>: outside the sliding screen, so a page transition never snapshots it.
  return createPortal(
    <dialog
      ref={dialogRef}
      data-prompt
      aria-labelledby="prompt-title"
      aria-describedby="prompt-body"
      onClose={skip}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border-2 border-line-strong bg-surface p-6 text-center text-ink"
    >
      {current === datesKey && (
        <div className="space-y-4">
          <h2 id="prompt-title" className="text-2xl font-bold">
            {t(best.fit === "atRisk" ? "prompt.dates.titleAtRisk" : "prompt.dates.titleTight")}
          </h2>
          <div id="prompt-body" className="space-y-2 text-lg">
            <p>{fitReason(t, lang, best)}</p>
            <p>{t("prompt.dates.body")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={editHref} transitionTypes={signedOut ? BACK : undefined} onClick={close} data-button autoFocus className={primary}>
              {t("prompt.dates.change")}
            </Link>
            <button type="button" onClick={close} className={secondary}>
              {t("prompt.skip")}
            </button>
          </div>
        </div>
      )}
      {current === SKIP_SIGN_IN && (
        <div className="space-y-4">
          <h2 id="prompt-title" className="text-2xl font-bold">
            {t("prompt.signIn.title")}
          </h2>
          <p id="prompt-body" className="text-lg">
            {t("prompt.signIn.body")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {/* Auth0's login needs a full page load, not a client-side Link. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/auth/login?returnTo=/journey" onClick={close} data-button autoFocus className={primary}>
              {t("prompt.signIn.button")}
            </a>
            <button type="button" onClick={close} className={secondary}>
              {t("prompt.skip")}
            </button>
          </div>
        </div>
      )}
    </dialog>,
    document.body,
  );
}
