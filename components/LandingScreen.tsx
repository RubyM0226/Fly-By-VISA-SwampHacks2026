"use client";

import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { GlobeLoader, useSupportsWebGL } from "./GlobeLoader";
import { DEFAULT_ZOOM, ZOOM_LEVELS } from "./HomeScreen";
import { LaunchButton } from "./LaunchButton";

const noPick = () => {};

/**
 * The first screen: what FlyByVisa is, and a way in. Same grid and globe box
 * as the country picker (HomeScreen), so "Get started" rolls to it with the
 * globe in the same place. Here the globe only turns slowly on its own; it
 * becomes interactive on the next screen.
 */
export function LandingScreen() {
  const { t, lang } = useT();
  const webgl = useSupportsWebGL();

  return (
    // Keep these classes in step with HomeScreen, so the globe does not jump.
    <div data-hills-peek className="relative -mt-6 ml-[calc(50%-50cqw)] w-[100cqw] px-3 py-3 sm:-mt-10 sm:px-5 @4xl:grid @4xl:h-[calc(100dvh-var(--sticky-header-h,0px)-var(--hills-peek))] @4xl:min-h-[34rem] @4xl:grid-cols-[minmax(18rem,26rem)_1fr] @4xl:items-center @4xl:gap-4">
      <div className="@4xl:self-center">
        <div className="space-y-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-lg sm:p-5">
          <h1 className="text-3xl font-bold text-accent sm:text-4xl">{APP_NAME[lang]}</h1>
          <p className="text-lg">{t("landing.about")}</p>
          <LaunchButton
            href="/places"
            label={t("landing.getStarted")}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 @4xl:mt-0 @4xl:h-full @4xl:min-h-0">
        {webgl && (
          // Same box as HomeScreen's globe (see the notes there).
          <div className="flex w-full flex-col items-center [--globe-max:70dvh] [--zoom-mt:0.5rem] [--zoom-pos:static] @4xl:min-h-0 @4xl:flex-1 @4xl:flex-row @4xl:items-end @4xl:justify-center @4xl:[container-type:size] @4xl:[--globe-max:min(100cqw,100cqh)] @4xl:[--zoom-mt:0px] @4xl:[--zoom-pos:absolute]">
            <div className="relative w-full max-w-(--globe-max)">
              {/* Decorative here: it spins on its own (unless motion is
                  paused) and ignores the pointer, so it cannot be dragged,
                  clicked or zoomed. */}
              <div aria-hidden="true" className="pointer-events-none aspect-square w-full select-none">
                <GlobeLoader from="" to="" onPick={noPick} zoom={ZOOM_LEVELS[DEFAULT_ZOOM]} />
              </div>
              {/* Holds the room the zoom buttons take on the next screen. */}
              <div aria-hidden="true" className="mt-(--zoom-mt) h-12 [position:var(--zoom-pos)]" />
            </div>
          </div>
        )}
        {/* The next screen has its hint here; keep the same room so the globe
            sits in the same place. */}
        <p aria-hidden="true" className="invisible max-w-prose rounded-xl px-3 py-2 text-center text-sm">
          {t("home.globeHint")} {t("home.scope")}
        </p>
      </div>
    </div>
  );
}
