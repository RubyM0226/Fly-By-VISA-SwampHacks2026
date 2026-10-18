"use client";

import { COUNTRIES, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { ChevronIcon } from "./Icons";

interface Props {
  id: string;
  label: string;
  /** Which countries can be picked here. The rest are listed as coming soon. */
  enabled: CountryCode[];
  value: "" | CountryCode;
  onChange: (code: CountryCode) => void;
}

/** A big native dropdown. The globe and this list stay in sync. */
export function PlaceSelect({ id, label, enabled, value, onChange }: Props) {
  const { t } = useT();
  const sorted = [
    ...COUNTRIES.filter((c) => enabled.includes(c.code)),
    ...COUNTRIES.filter((c) => !enabled.includes(c.code)),
  ];
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <label htmlFor={id} className="block text-base font-bold">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as CountryCode)}
          className="min-h-12 w-full appearance-none truncate rounded-xl border-2 border-line-strong bg-surface py-2 pl-4 pr-10 text-lg font-semibold text-ink hover:bg-hover"
        >
          <option value="" disabled>
            {t("home.choose")}
          </option>
          {sorted.map((c) => {
            const on = enabled.includes(c.code);
            return (
              <option key={c.code} value={c.code} disabled={!on}>
                {on ? t(c.nameKey) : `${t(c.nameKey)} (${t("home.comingSoon")})`}
              </option>
            );
          })}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" />
      </div>
    </div>
  );
}
