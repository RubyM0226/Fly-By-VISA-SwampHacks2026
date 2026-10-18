"use client";

import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { LaunchButton } from "./LaunchButton";
import { GLOBE_HANDOFF } from "./ScreenTransition";

/**
 * The first screen: what FlyByVisa is, and a way in. It sits beside the shared
 * globe (see GlobeStage); "Get started" swaps this box for the country picker
 * while the globe stays where it is.
 */
export function LandingScreen() {
  const { t, lang } = useT();

  return (
    <div className="space-y-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-lg sm:p-5">
      <h1 className="text-3xl font-bold text-accent sm:text-4xl">{APP_NAME[lang]}</h1>
      <p className="text-lg">{t("landing.about")}</p>
      <LaunchButton
        href="/places"
        label={t("landing.getStarted")}
        transitionTypes={GLOBE_HANDOFF}
        // Stay where we are, so the shared globe does not scroll away.
        scroll={false}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink"
      />
    </div>
  );
}
