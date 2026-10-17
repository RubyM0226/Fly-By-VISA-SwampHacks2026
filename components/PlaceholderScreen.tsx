"use client";

import { useT, type UiKey } from "@/lib/i18n";

/** An empty page with just its title, for sections that come in a later phase. */
export function PlaceholderScreen({ title }: { title: UiKey }) {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t(title)}</h1>
      <p className="text-lg text-muted">{t("page.comingSoon")}</p>
    </div>
  );
}
