"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { useTrip, tripStore } from "@/lib/trip";
import { formatDate, STEP_ORDER } from "@/lib/journey";
import { STEP_BY_ID } from "@/content/steps";
import { getUserJourney, claimAnonymousJourney } from "@/app/actions/journey";

export function MyPlanScreen() {
  const { t, lang } = useT();
  const user = useProfile();
  const { user: auth0User } = useUser();
  const [trip] = useTrip();

  // Gatekeeper to prevent React infinite loops
  const hasSynced = useRef(false);

  // Sync travel profile and journey state from Tiger Data on login
  useEffect(() => {
    if (auth0User?.sub && !hasSynced.current) {
      hasSynced.current = true;

      const syncDatabase = async () => {
        const tempId = localStorage.getItem("temp_journey_id");
        if (tempId) {
          await claimAnonymousJourney(tempId);
          localStorage.removeItem("temp_journey_id");
        }

        const data = await getUserJourney();
        if (data) {
          tripStore.set({ 
            from: data.profile?.from || "IN",
            to: data.profile?.to || "US",
            arrival: data.profile?.arrival || "",
            stayMonths: data.profile?.stayMonths || 1,
            purpose: data.profile?.purpose || "family",
            done: data.stop_status || {} 
          });
        }
      };

      syncDatabase();
    }
  }, [auth0User?.sub]);

  // Calculate their current place on the roadmap
  const currentId = STEP_ORDER.find((id) => !trip.done[id]);
  const currentStepTitle = currentId 
    ? STEP_BY_ID[currentId]?.text[lang]?.title || "Next Step"
    : "All steps completed! You are ready to fly.";

  // Helper to format country codes
  const getCountryName = (code?: string) => {
    if (code === "IN") return "India";
    if (code === "US") return "United States";
    return code || "Not selected";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("nav.myPlan")}</h1>

      {user === undefined && <p className="text-lg text-muted">{t("myPlan.checking")}</p>}

      {user === null && (
        <>
          <p className="text-lg">{t("myPlan.signInFirst")}</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/auth/login?returnTo=/my-plan"
            data-button
            className="inline-flex min-h-14 items-center rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
          >
            {t("nav.login")}
          </a>
        </>
      )}

      {user && (
        <>
          <p className="text-lg font-semibold">{t("myPlan.signedInAs", { name: user.name || user.email || "" })}</p>
          
          <div className="rounded-xl border-2 border-line-strong bg-surface p-6">
            <h2 className="mb-6 text-2xl font-bold text-accent">Your Travel Profile</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wide text-muted">Route</p>
                <p className="text-lg font-medium text-slate-800">
                  {getCountryName(trip.from)} → {getCountryName(trip.to)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wide text-muted">Arrival Date</p>
                <p className="text-lg font-medium text-slate-800">
                  {trip.arrival ? formatDate(trip.arrival, lang) : "Not selected"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wide text-muted">Duration of Stay</p>
                <p className="text-lg font-medium text-slate-800">
                  {trip.stayMonths ? `${trip.stayMonths} months` : "Not selected"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wide text-muted">Reason for Visit</p>
                <p className="text-lg font-medium text-slate-800">Tourism / Business (B1/B2)</p>
              </div>
            </div>

            <hr className="my-6 border-line" />

            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-wide text-muted">Current Roadmap Status</p>
              <div className="flex items-center gap-3 rounded-lg border-2 border-accent/20 bg-accent-soft p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-accent-ink">{currentStepTitle}</p>
              </div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/auth/logout"
            data-button
            onClick={() => {
              // Wipe the browser's memory so the next user starts fresh
              tripStore.set({ 
                from: undefined as any, 
                to: undefined as any, 
                arrival: "", 
                stayMonths: 1, 
                done: {} 
              });
              localStorage.removeItem("temp_journey_id");
            }}
            className="mt-4 inline-flex min-h-12 items-center rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
          >
            {t("myPlan.signOut")}
          </a>
        </>
      )}
    </div>
  );
}