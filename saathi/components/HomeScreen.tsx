"use client";

import Link from "next/link";
import { COUNTRY_BY_CODE, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { ArrowIcon } from "./Icons";
import { GlobeLoader, useSupportsWebGL } from "./GlobeLoader";
import { PlaceChoice } from "./PlaceChoice";

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
    <div className="space-y-8">
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t("home.title")}</h1>
        <p className="text-xl text-muted">{t("home.lead")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <PlaceChoice
            name="from"
            legend={t("home.from")}
            options={["IN"]}
            value={trip.from}
            onChange={pick}
          />
          <PlaceChoice
            name="to"
            legend={t("home.to")}
            options={["US"]}
            value={trip.to}
            onChange={pick}
          />

          <div className="space-y-2">
            {ready ? (
              <Link
                href="/start"
                data-button
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink sm:w-auto"
              >
                {t("home.continue")}
                <ArrowIcon className="h-6 w-6" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  aria-describedby="pick-both-hint"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-6 py-3 text-xl font-bold text-muted sm:w-auto"
                >
                  {t("home.continue")}
                </button>
                <p id="pick-both-hint" className="text-base text-muted">
                  {t("home.pickBoth")}
                </p>
              </>
            )}
            <p className="text-base text-muted">{t("home.scope")}</p>
          </div>
        </div>

        {webgl && (
          <div className="order-first space-y-2 lg:order-none">
            <div
              role="img"
              aria-label={t("home.globeLabel")}
              className="relative h-72 overflow-hidden rounded-2xl bg-[#08182b] sm:h-96 lg:h-[30rem]"
            >
              <GlobeLoader from={trip.from} to={trip.to} onPick={pick} />
            </div>
            <p className="text-base text-muted">{t("home.globeHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
