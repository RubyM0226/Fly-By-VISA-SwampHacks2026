"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { useTrip, tripStore, type Trip } from "@/lib/trip";
import { formatDate, STEP_ORDER } from "@/lib/journey";
import { STEP_BY_ID } from "@/content/steps";
import { getUserJourney, claimAnonymousJourney } from "@/app/actions/journey";
import { createHelperLink, revokeHelperLink } from "@/app/actions/helper";
import { tripFromProfile } from "@/lib/tripProfile";
import { DocumentIcon } from "./Icons";
import { TripDetailsCard } from "./TripDetailsCard";

export function AccountScreen() {
  const { t, lang } = useT();
  const user = useProfile();
  const { user: auth0User } = useUser();
  const [trip] = useTrip();
  const [helperUrl, setHelperUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
          tripStore.set({ ...tripFromProfile(data.profile), done: data.stop_status || {} });
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

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    const res = await createHelperLink("Family Helper");
    if (res.token) {
      const url = `${window.location.origin}/help/${res.token}`;
      setHelperUrl(url);
      navigator.clipboard.writeText(url);
      alert("Helper link copied to clipboard!");
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("nav.account")}</h1>

      {user === undefined && <p className="text-lg text-muted">{t("myPlan.checking")}</p>}

      {user === null && (
        <>
          <p className="text-lg">{t("myPlan.signInFirst")}</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/auth/login?returnTo=/account"
            data-button
            className="inline-flex min-h-14 items-center rounded-xl bg-accent px-6 py-3 text-xl font-bold text-accent-ink"
          >
            {t("nav.login")}
          </a>
        </>
      )}

      {user && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold">{t("myPlan.signedInAs", { name: user.name || user.email || "" })}</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/auth/logout"
              data-button
              onClick={() => {
                // Wipe the browser's memory so the next user starts fresh
                tripStore.set({ 
                  from: undefined as unknown as Trip["from"], 
                  to: undefined as unknown as Trip["to"], 
                  arrival: "", 
                  stayMonths: 1, 
                  done: {} 
                });
                localStorage.removeItem("temp_journey_id");
              }}
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
            >
              {t("myPlan.signOut")}
            </a>
          </div>

          <TripDetailsCard />
          
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

          {/* Add collaborator: for now, the helper link. The full invite feature comes later. */}
          <div className="rounded-xl border-2 border-line-strong bg-surface p-6 space-y-4">
            <h2 className="text-2xl font-bold text-accent">{t("account.addCollaborator")}</h2>
            <p className="text-lg text-muted">{t("account.addCollaboratorLead")}</p>

            {helperUrl ? (
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-line bg-slate-50 p-3 text-sm font-mono break-all text-slate-700">
                  {helperUrl}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(helperUrl);
                      alert("Link copied to clipboard!");
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 py-2 text-base font-bold text-accent-ink hover:bg-accent/90"
                  >
                    Copy Link Again
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = helperUrl.split("/").pop();
                      if (token) await revokeHelperLink(token);
                      setHelperUrl(null);
                      alert("Helper link revoked successfully.");
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 px-5 py-2 text-base font-semibold text-red-700 hover:bg-red-100"
                  >
                    Stop Sharing (Revoke Link)
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateLink}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 py-3 text-lg font-bold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate & Copy Helper Link"}
              </button>
            )}
          </div>

          {/* Private file uploads now live on the Documents tab. */}
          <div className="space-y-3 rounded-xl border-2 border-line-strong bg-surface p-6">
            <p className="text-lg">{t("myPlan.filesMoved")}</p>
            <Link
              href="/documents"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
            >
              <DocumentIcon className="h-6 w-6 shrink-0" />
              {t("journey.goToDocuments")}
            </Link>
          </div>

          {/* Phase 3: "Your acknowledgement" (documents consent) goes here. */}

        </>
      )}
    </div>
  );
}