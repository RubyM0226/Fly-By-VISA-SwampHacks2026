"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/**
 * A caregiver's Account page. It belongs to the helper, not the traveler: it
 * is token-only, so no sign-in, log-out or traveler account controls here.
 */
export function HelperAccountScreen() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("nav.account")}</h1>

      <div className="space-y-4 rounded-xl border-2 border-line-strong bg-surface p-6">
        {/* shortcut: the traveler's name is not stored with the helper link, so this says "a traveler"; add it to the link to name them. */}
        <p className="text-xl font-semibold">{t("helperAccount.viewing")}</p>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
        >
          {t("helperAccount.stopViewing")}
        </Link>
      </div>

      {/* Not connected yet: no Auth0 call, no account linking. Caregivers stay token-only. */}
      <div className="space-y-3 rounded-xl border-2 border-line-strong bg-surface p-6">
        <button
          type="button"
          disabled
          aria-describedby="own-account-soon"
          className="inline-flex min-h-12 items-center rounded-xl border-2 border-line bg-surface px-5 py-2 text-lg font-semibold text-muted opacity-70"
        >
          {t("helperAccount.ownAccount")}
        </button>
        <p id="own-account-soon" className="text-lg font-semibold text-muted">
          {t("helperAccount.comingSoon")}
        </p>
      </div>
    </div>
  );
}
