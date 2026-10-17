"use client";

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
    <div className="relative -mt-6 ml-[calc(50%-50cqw)] w-[100cqw] px-3 py-3 sm:-mt-10 sm:px-6 sm:py-5 @4xl:grid @4xl:h-[calc(100dvh-var(--sticky-header-h,0px))] @4xl:min-h-[34rem] @4xl:grid-cols-[minmax(18rem,26rem)_1fr] @4xl:gap-8">
      <div className="@4xl:self-center">
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
      </div>

      <div className="mt-6 flex flex-col items-center @4xl:mt-0 @4xl:min-h-0">
        {webgl && (
          // The globe is sized by height, so keep its box square (as big as the
          // space allows) or a tall, narrow box would crop its sides.
          <div className="flex aspect-square max-h-[60dvh] w-full items-center justify-center [container-type:size] @4xl:aspect-auto @4xl:max-h-none @4xl:min-h-0 @4xl:flex-1">
            <div
              role="img"
              aria-label={t("home.globeLabel")}
              className="relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)]"
            >
              <GlobeLoader from={trip.from} to={trip.to} onPick={pick} />
            </div>
          </div>
        )}
        <p className="mt-8 inline-block rounded-xl bg-surface px-3 py-2 text-center text-sm text-muted shadow">
          {webgl && <>{t("home.globeHint")} </>}
          {t("home.scope")}
        </p>
      </div>
    </div>
  );
}
