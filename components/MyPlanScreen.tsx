"use client";

import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";

/** Placeholder account page. Trip-plan features come later. */
export function MyPlanScreen() {
  const { t } = useT();
  const user = useProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t("nav.myPlan")}</h1>

      {user === undefined && <p className="text-lg text-muted">{t("myPlan.checking")}</p>}

      {user === null && (
        <>
          <p className="text-lg">{t("myPlan.signInFirst")}</p>
          {/* Auth0 routes need a full page load, not a client-side Link. */}
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
          <p className="rounded-xl border-2 border-line-strong bg-surface p-4 text-lg">{t("myPlan.placeholder")}</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/auth/logout"
            data-button
            className="inline-flex min-h-12 items-center rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
          >
            {t("myPlan.signOut")}
          </a>
        </>
      )}
    </div>
  );
}
