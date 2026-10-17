"use client";

import { COUNTRY_BY_CODE, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { CheckIcon } from "./Icons";

interface Props {
  name: string;
  legend: string;
  options: CountryCode[];
  value: "" | CountryCode;
  onChange: (code: CountryCode) => void;
}

/** A big, native radio group. The globe and this list stay in sync. */
export function PlaceChoice({ name, legend, options, value, onChange }: Props) {
  const { t } = useT();
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xl font-bold">{legend}</legend>

      {options.map((code) => {
        const selected = value === code;
        return (
          <label key={code} className="block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={code}
              checked={selected}
              onChange={() => onChange(code)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-lg font-semibold peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] ${
                selected
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-strong bg-surface text-ink hover:bg-accent-soft"
              }`}
            >
              <span>{t(COUNTRY_BY_CODE[code].nameKey)}</span>
              {selected && (
                <span className="inline-flex items-center gap-1 text-base">
                  <CheckIcon className="h-5 w-5" />
                  {t("home.selected")}
                </span>
              )}
            </span>
          </label>
        );
      })}

      <label className="block">
        <input type="radio" name={name} disabled className="peer sr-only" />
        <span className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-dashed border-line-strong px-4 py-3 text-lg text-muted">
          <span>{t("home.moreSoon")}</span>
          <span className="text-base font-semibold">{t("home.comingSoon")}</span>
        </span>
      </label>
    </fieldset>
  );
}
