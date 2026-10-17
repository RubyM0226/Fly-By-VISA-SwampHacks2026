"use client";

import { useSettings, type Lang } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { ChevronIcon } from "./Icons";

// Each language is written in its own script, never with flags.
// Only languages with full translations can be picked; the rest are listed
// so people can see they are planned.
const OPTIONS: { code: string; label: string; lang?: Lang }[] = [
  { code: "en", label: "English", lang: "en" },
  { code: "hi", label: "हिन्दी", lang: "hi" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "sw", label: "Kiswahili" },
  { code: "ur", label: "اردو" },
  { code: "zh-Hans", label: "普通话" },
  { code: "ja", label: "日本語" },
  { code: "yue", label: "粵語" },
  { code: "pt", label: "Português" },
  { code: "sv", label: "Svenska" },
];

export function LanguageSelect() {
  const [settings, update] = useSettings();
  const { t } = useT();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("nav.language")}</span>
      <select
        value={settings.lang}
        onChange={(e) => update({ lang: e.target.value as Lang })}
        className="min-h-12 w-32 appearance-none truncate rounded-xl border-2 border-line-strong bg-surface py-2 pl-4 pr-10 font-semibold text-ink hover:bg-accent-soft sm:w-40"
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code} lang={o.code} disabled={!o.lang}>
            {o.lang ? o.label : `${o.label} (${t("home.comingSoon")})`}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-3 h-5 w-5" />
    </label>
  );
}
