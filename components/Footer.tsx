"use client";

import { LINKS } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { ExternalIcon } from "./Icons";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t-2 border-line bg-surface">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-6 text-base text-muted sm:px-6">
        <p>{t("footer.disclaimer")}</p>
        <p>{t("footer.privacy")}</p>
        <p>
          {t("footer.scam")}{" "}
          <a
            href={LINKS.fraudWarning}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-1 font-semibold text-accent underline"
          >
            {t("footer.scamLink")}
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">{t("journey.opensNewTab")}</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
