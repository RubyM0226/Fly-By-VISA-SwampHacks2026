"use client";

import { useT } from "@/lib/i18n";

/** Grey stand-in blocks that look like a page, blurred. Not real content. */
function FakePage() {
  return (
    <div aria-hidden inert className="pointer-events-none select-none blur-md">
      <div className="space-y-4">
        <div className="h-9 w-1/2 rounded-lg bg-line" />
        <div className="h-5 w-3/4 rounded bg-line" />
        <div className="h-14 w-full rounded-xl bg-line" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The signed-out view of a gated page: a blurred page with a sign-in card on top. */
export function SignInWall({ returnTo }: { returnTo: string }) {
  const { t } = useT();
  return (
    <div className="relative min-h-[60vh]">
      <FakePage />
      <div className="absolute inset-0 flex items-start justify-center px-2 pt-10 sm:items-center sm:pt-0">
        <section aria-labelledby="gate-title" className="w-full max-w-md space-y-3 rounded-2xl border-2 border-accent bg-surface p-6 text-center shadow-lg">
          <h1 id="gate-title" className="text-2xl font-bold">
            {t("gate.title")}
          </h1>
          <p className="text-lg">{t("gate.body")}</p>
          {/* Auth0's login needs a full page load, not a client-side Link. */}
          <a
            href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
            data-button
            className="inline-flex min-h-14 items-center rounded-xl bg-accent px-8 py-3 text-xl font-bold text-accent-ink"
          >
            {t("gate.button")}
          </a>
        </section>
      </div>
    </div>
  );
}
