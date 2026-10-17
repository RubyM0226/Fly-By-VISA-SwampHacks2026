"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { COUNTRY_BY_CODE, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { LaunchButton } from "./LaunchButton";
import { GlobeLoader, useSupportsWebGL } from "./GlobeLoader";
import { MinusIcon, PlusIcon } from "./Icons";
import { PlaceSelect } from "./PlaceSelect";

// Globe zoom steps; 1 is the globe's own framing. Starts one step in so the
// globe fills its space.
const ZOOM_LEVELS = [0.8, 1, 1.25, 1.5, 1.75, 2];
const DEFAULT_ZOOM = 2;

// aria-disabled, not disabled, so keyboard focus stays on the button at the limit.
const zoomButton =
  "inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong bg-surface shadow hover:bg-accent-soft aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-surface";
const MAX_ZOOM = ZOOM_LEVELS.length - 1;

export function HomeScreen() {
  const { t } = useT();
  const [trip] = useTrip();
  const webgl = useSupportsWebGL();
  const [zoomStep, setZoomStep] = useState(DEFAULT_ZOOM);

  // Auth0 integration to detect returning users
  const { user, isLoading } = useUser();

  const ready = trip.from === "IN" && trip.to === "US";

  function pick(code: CountryCode) {
    const c = COUNTRY_BY_CODE[code];
    if (c.origin) tripStore.set({ from: code as "IN" });
    else if (c.destination) tripStore.set({ to: code as "US" });
  }

  return (
    // Full-bleed: fill the content column beside the nav, under the sticky header.
    // Choices on the left, a large globe on the right once the content area is
    // wide enough (about 900px); stacked below that.
    <div className="relative -mt-6 ml-[calc(50%-50cqw)] w-[100cqw] px-3 py-3 sm:-mt-10 sm:px-5 @4xl:grid @4xl:h-[calc(100dvh-var(--sticky-header-h,0px))] @4xl:min-h-[34rem] @4xl:grid-cols-[minmax(18rem,26rem)_1fr] @4xl:items-center @4xl:gap-4">
      <div className="@4xl:self-center">
        {/* If Auth0 is loading, we can show a minimal skeleton or just wait a split second */}
        {isLoading ? (
           <div className="space-y-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-lg sm:p-5 opacity-50">
             <p className="text-base font-semibold text-muted">{t("home.checkingAccount")}</p>
           </div>
        ) : user ? (
          /* LOGGED IN VIEW: Welcome Back Shortcut */
          <div className="space-y-4 rounded-2xl border-2 border-accent bg-accent-soft p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-accent-ink">
              {t("home.welcomeBack", { name: user.given_name || user.nickname || t("home.traveler") })}
            </h1>
            <p className="text-lg text-ink">
              {t("home.journeySaved")}
            </p>
            
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/journey"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink shadow hover:bg-accent/90"
              >
                {t("home.resumeJourney")}
              </Link>
              <Link
                href="/my-plan"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-accent px-6 py-2 text-lg font-bold text-accent-ink hover:bg-accent/10"
              >
                {t("home.viewProfile")}
              </Link>
            </div>
          </div>
        ) : (
          /* LOGGED OUT VIEW: The original location picker */
          <div className="space-y-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-lg sm:p-5">
            {/* The two dropdown titles say it all; the page title stays for screen readers. */}
            <h1 className="sr-only">{t("home.title")}</h1>
            <p className="text-base text-muted">{t("home.lead")}</p>

            <div className="flex flex-col gap-4">
              <PlaceSelect id="place-from" label={t("home.from")} enabled={["IN"]} value={trip.from} onChange={pick} />
              <PlaceSelect id="place-to" label={t("home.to")} enabled={["US"]} value={trip.to} onChange={pick} />
            </div>

            {ready ? (
              <LaunchButton
                href="/start"
                label={t("home.continue")}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink"
              />
            ) : (
              <button
                type="button"
                disabled
                aria-describedby="pick-both-hint"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-6 py-2 text-lg font-bold text-muted"
              >
                {t("home.continue")}
              </button>
            )}

            {!ready && (
              <p id="pick-both-hint" className="text-sm text-muted">
                {t("home.pickBoth")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Globe, its zoom buttons and the hint below it, as one group. */}
      <div className="mt-4 flex flex-col items-center gap-2 @4xl:mt-0 @4xl:h-full @4xl:min-h-0">
        {webgl && (
          // Wide screens: the globe is sized by height, so keep its box square
          // (as big as the space allows) or a tall, narrow box would crop its
          // sides; the zoom buttons sit on its lower right corner. Narrow
          // screens: the globe is as wide as the column and the zoom buttons
          // go in a row below it, so they don't cover it.
          // This box is a size container on wide screens, so @4xl: inside it
          // would query this box, not the page. It sets the two modes as
          // variables instead.
          <div className="flex w-full flex-col items-center [--globe-max:70dvh] [--zoom-dir:row] [--zoom-mt:0.5rem] [--zoom-pos:static] @4xl:min-h-0 @4xl:flex-1 @4xl:flex-row @4xl:items-end @4xl:justify-center @4xl:[container-type:size] @4xl:[--globe-max:min(100cqw,100cqh)] @4xl:[--zoom-dir:column] @4xl:[--zoom-mt:0px] @4xl:[--zoom-pos:absolute]">
            <div className="relative w-full max-w-(--globe-max)">
              <div role="img" aria-label={t("home.globeLabel")} className="aspect-square w-full">
                <GlobeLoader from={trip.from} to={trip.to} onPick={pick} zoom={ZOOM_LEVELS[zoomStep]} />
              </div>
              <div
                role="group"
                aria-label={t("home.zoom")}
                className="right-2 bottom-2 mt-(--zoom-mt) flex justify-end gap-2 [flex-direction:var(--zoom-dir)] [position:var(--zoom-pos)]"
              >
                <button
                  type="button"
                  onClick={() => setZoomStep((s) => Math.min(s + 1, MAX_ZOOM))}
                  aria-disabled={zoomStep === MAX_ZOOM}
                  aria-label={t("home.zoomIn")}
                  title={t("home.zoomIn")}
                  className={zoomButton}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomStep((s) => Math.max(s - 1, 0))}
                  aria-disabled={zoomStep === 0}
                  aria-label={t("home.zoomOut")}
                  title={t("home.zoomOut")}
                  className={zoomButton}
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        <p className="max-w-prose rounded-xl bg-surface px-3 py-2 text-center text-sm text-muted shadow">
          {webgl && <>{t("home.globeHint")} </>}
          {t("home.scope")}
        </p>
      </div>
    </div>
  );
}
