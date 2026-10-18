"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { useTrip, tripStore, type Trip } from "@/lib/trip";
import { STEPS_BY_PURPOSE, type VisaCategory } from "@/lib/journey";
import { STEP_BY_ID } from "@/content/steps";
import { getUserJourney, claimAnonymousJourney } from "@/app/actions/journey";
import { createHelperLink, revokeHelperLink } from "@/app/actions/helper";
import { tripFromProfile } from "@/lib/tripProfile";
import { TripDetailsCard } from "./TripDetailsCard";
import { YourFilesCard } from "./YourFilesCard";

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
  const stepOrder = STEPS_BY_PURPOSE[(trip.purpose as VisaCategory) || "family"];
  const currentId = stepOrder.find((id) => !trip.done[id]);
  const currentStepTitle = currentId ? (STEP_BY_ID[currentId]?.text[lang]?.title ?? "") : t("account.allDone");

  const firstName = trip.firstName.trim() || auth0User?.given_name || "";

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    const res = await createHelperLink("Family Helper");
    if (res.token) {
      const url = `${window.location.origin}/help/${res.token}`;
      setHelperUrl(url);
      navigator.clipboard.writeText(url);
      alert(t("account.helper.copied"));
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{firstName ? t("account.hi", { name: firstName }) : t("account.hiPlain")}</h1>

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
          <TripDetailsCard />

          <section aria-labelledby="roadmap-status-title" className="space-y-2 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-5">
            <h2 id="roadmap-status-title" className="text-sm font-bold uppercase tracking-wide text-muted">
              {t("account.roadmapStatus")}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-ink">{currentStepTitle}</p>
            </div>
          </section>

          {/* Add Family Helper: a private, read-only helper link. */}
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
                      alert(t("account.helper.copied"));
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 py-2 text-base font-bold text-accent-ink hover:bg-accent/90"
                  >
                    {t("account.helper.copyAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = helperUrl.split("/").pop();
                      if (token) await revokeHelperLink(token);
                      setHelperUrl(null);
                      alert(t("account.helper.stopped"));
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 px-5 py-2 text-base font-semibold text-red-700 hover:bg-hover-danger"
                  >
                    {t("account.helper.stop")}
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
                {isGenerating ? t("account.helper.generating") : t("account.helper.generate")}
              </button>
            )}
          </div>

          <YourFilesCard />

          <div className="flex justify-center pt-2">
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
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-danger bg-surface px-6 py-2 text-lg font-semibold text-danger hover:bg-hover-danger"
            >
              {t("myPlan.signOut")}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
