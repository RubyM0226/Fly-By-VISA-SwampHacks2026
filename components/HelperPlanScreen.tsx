"use client";

import { useT } from "@/lib/i18n";
import { sharedTrip, travelerName, type SharedJourney } from "@/lib/helperView";
import { JourneyView } from "./JourneyScreen";

// Opens WhatsApp with a ready greeting. Unchanged from before.
const WHATSAPP_URL =
  "https://wa.me/?text=Hi,%20I'm%20reviewing%20your%20travel%20profile%20and%20itinerary%20details%20on%20Fly%20By%20VISA!";

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

/** A revoked or unknown helper link. */
export function HelperLinkExpired() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-xl space-y-4 px-6 py-20 text-center">
      <h1 className="text-3xl font-bold text-danger">{t("helper.expired.title")}</h1>
      <p className="text-lg text-muted">{t("helper.expired.body")}</p>
    </div>
  );
}

export function HelperLoading() {
  const { t } = useT();
  return <div className="mx-auto max-w-xl px-6 py-20 text-center text-lg text-muted">{t("helper.loading")}</div>;
}

/**
 * The caregiver's shared plan: the traveler's name, then a read-only copy of
 * their Dashboard built from the shared journey, then a way to message them.
 */
export function HelperPlanScreen({ journey }: { journey: SharedJourney }) {
  const { t } = useT();
  const name = travelerName(journey.profile);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink">{t("helper.badge")}</span>
        <h1 className="text-3xl font-bold sm:text-4xl">{name ? t("helper.title", { name }) : t("helper.titlePlain")}</h1>
      </div>

      <JourneyView trip={sharedTrip(journey)} />

      <section aria-labelledby="contact-title" className="space-y-3 rounded-xl border-2 border-dashed border-line-strong bg-surface p-6 text-center">
        <h2 id="contact-title" className="text-xl font-bold">
          {t("helper.contact.title")}
        </h2>
        <p className="text-muted">{t("helper.contact.body")}</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-lg font-bold text-white shadow hover:bg-green-800"
        >
          <WhatsAppLogo className="h-6 w-6 shrink-0" />
          {t("helper.contact.button")}
          <span className="sr-only">{t("journey.opensNewTab")}</span>
        </a>
      </section>
    </div>
  );
}
