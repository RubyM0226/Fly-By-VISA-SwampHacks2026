"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useT } from "@/lib/i18n";
import { useTrip } from "@/lib/trip";
import { LaunchButton } from "./LaunchButton";
import { pickPlace as pick } from "./GlobeStage";
import { PlaceSelect } from "./PlaceSelect";

export function HomeScreen() {
  const { t } = useT();
  const [trip] = useTrip();

  // Auth0 integration to detect returning users
  const { user, isLoading } = useUser();

  const ready = trip.from === "IN" && trip.to === "US";

  return (
    // The country choices, beside the shared globe (see GlobeStage).
    <div>
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
                href="/account"
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
  );
}
