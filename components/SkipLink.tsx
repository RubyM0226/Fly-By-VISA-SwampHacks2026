"use client";

import { useT } from "@/lib/i18n";

export function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#main-content"
      data-button
      className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-3 focus:text-accent-ink focus:font-semibold"
    >
      {t("skip")}
    </a>
  );
}
