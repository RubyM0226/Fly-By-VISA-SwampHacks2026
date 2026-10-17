"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRY_BY_CODE, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { LaunchButton } from "./LaunchButton";
import { GlobeLoader, useSupportsWebGL } from "./GlobeLoader";
import { PlaceSelect } from "./PlaceSelect";

export function HomeScreen() {
  const { t } = useT();
  const [trip] = useTrip();
  const webgl = useSupportsWebGL();

  // Start the globe just under the choices card so the card never hides it.
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardBottom, setCardBottom] = useState(0);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCardBottom(el.offsetTop + el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = trip.from === "IN" && trip.to === "US";

  function pick(code: CountryCode) {
    const c = COUNTRY_BY_CODE[code];
    if (c.origin) tripStore.set({ from: code as "IN" });
    else if (c.destination) tripStore.set({ to: code as "US" });
  }

  return (
    // Full-bleed: fill the content column beside the nav, under the sticky header.
    <div className="relative -mt-6 ml-[calc(50%-50cqw)] h-[calc(100dvh-var(--sticky-header-h,0px)-6rem)] min-h-[34rem] md:h-[calc(100dvh-var(--sticky-header-h,0px))] w-[100cqw] sm:-mt-10">
      {webgl && (
        <div role="img" aria-label={t("home.globeLabel")} className="absolute inset-x-0 bottom-0" style={{ top: cardBottom }}>
          <GlobeLoader from={trip.from} to={trip.to} onPick={pick} />
        </div>
      )}

      {/* The choices sit on top of the globe. Clicks pass through the gaps. */}
      <div ref={cardRef} className="pointer-events-none absolute inset-x-0 top-0 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="pointer-events-auto mx-auto max-w-5xl space-y-3 rounded-2xl border-2 border-line bg-surface p-4 shadow-lg sm:p-5">
          {/* The two dropdown titles say it all; the page title stays for screen readers. */}
          <h1 className="sr-only">{t("home.title")}</h1>
          <p className="text-base text-muted">{t("home.lead")}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <PlaceSelect id="place-from" label={t("home.from")} enabled={["IN"]} value={trip.from} onChange={pick} />
            <PlaceSelect id="place-to" label={t("home.to")} enabled={["US"]} value={trip.to} onChange={pick} />

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
          </div>

          {!ready && (
            <p id="pick-both-hint" className="text-sm text-muted">
              {t("home.pickBoth")}
            </p>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-5xl">
          <p className="inline-block rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow">
            {webgl && <>{t("home.globeHint")} </>}
            {t("home.scope")}
          </p>
        </div>
      </div>
    </div>
  );
}
