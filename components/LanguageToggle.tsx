"use client";

import { useSettings, type Lang } from "@/lib/settings";
import { useT } from "@/lib/i18n";

// Each language is written in its own script, never with flags.
const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: "en", label: "English" },
  { lang: "hi", label: "हिन्दी" },
];

export function LanguageToggle() {
  const [settings, update] = useSettings();
  const { t } = useT();
  return (
    <div role="group" aria-label={t("nav.language")} className="inline-flex overflow-hidden rounded-xl border-2 border-line-strong">
      {OPTIONS.map((o) => {
        const active = settings.lang === o.lang;
        return (
          <button
            key={o.lang}
            type="button"
            lang={o.lang}
            aria-pressed={active}
            onClick={() => update({ lang: o.lang })}
            className={`min-h-12 px-4 py-2 font-semibold ${
              active ? "bg-accent text-accent-ink" : "bg-surface text-ink hover:bg-accent-soft"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
