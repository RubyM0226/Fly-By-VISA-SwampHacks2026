"use client";

import { useRef, useState } from "react";
import { DEFAULT_SETTINGS, settingsStore, useSettings, type Settings } from "@/lib/settings";
import { tripStore } from "@/lib/trip";
import { useT, type UiKey } from "@/lib/i18n";
import { ChevronIcon, GearIcon, MinusIcon, PlusIcon } from "./Icons";
import { LanguageSelect } from "./LanguageSelect";

function Segmented<V extends number>({
  label,
  value,
  options,
  onChange,
  className = "grid grid-cols-2 gap-2 sm:grid-cols-4",
}: {
  label: string;
  value: V;
  options: { value: V; text: string; ariaLabel?: string; className?: string }[];
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={className}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`min-h-12 rounded-xl border-2 px-2.5 py-2 font-semibold sm:px-3 ${
              active
                ? "border-accent bg-accent text-accent-ink"
                : "border-line-strong bg-surface text-ink hover:bg-accent-soft"
            } ${o.className ?? ""}`}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
  onText,
  offText,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onText: string;
  offText: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-left hover:bg-accent-soft"
    >
      <span className="font-semibold">{label}</span>
      {/* The word On/Off is shown too, so state is never colour alone. */}
      <span
        className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-sm font-bold ${
          checked ? "bg-accent text-accent-ink" : "bg-warm text-warm-ink"
        }`}
      >
        {checked ? onText : offText}
      </span>
    </button>
  );
}

const SWITCHES: { key: keyof Settings; label: UiKey }[] = [
  { key: "highContrast", label: "a11y.highContrast" },
  { key: "monochrome", label: "a11y.mono" },
  { key: "dyslexiaFont", label: "a11y.dyslexia" },
  { key: "boldText", label: "a11y.bold" },
  { key: "underlineLinks", label: "a11y.underline" },
  { key: "highlightLinks", label: "a11y.highlight" },
  { key: "pauseMotion", label: "a11y.motion" },
  { key: "showDefinitions", label: "a11y.definitions" },
];

const SIZE_LABELS: UiKey[] = ["a11y.size0", "a11y.size1", "a11y.size2", "a11y.size3"];
const MAX_SIZE = SIZE_LABELS.length - 1;

/** − A +: one step smaller or bigger, same four sizes as before. */
function TextSizeControl({ value, onChange }: { value: Settings["textSize"]; onChange: (v: Settings["textSize"]) => void }) {
  const { t } = useT();
  const step = "inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong bg-surface hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface";
  return (
    <div role="group" aria-label={t("a11y.textSize")} className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange((value - 1) as Settings["textSize"])}
        disabled={value === 0}
        aria-label={t("a11y.smaller")}
        className={step}
      >
        <MinusIcon className="h-5 w-5" />
      </button>
      <span aria-hidden="true" className="w-8 text-center text-xl font-bold">
        A
      </span>
      <button
        type="button"
        onClick={() => onChange((value + 1) as Settings["textSize"])}
        disabled={value === MAX_SIZE}
        aria-label={t("a11y.bigger")}
        className={step}
      >
        <PlusIcon className="h-5 w-5" />
      </button>
      {/* Says the new size after each press. */}
      <span className="sr-only" aria-live="polite">
        {t(SIZE_LABELS[value])}
      </span>
    </div>
  );
}

/** Language and text size up front; everything else under "More". */
export function AccessibilityBar() {
  const { t } = useT();
  const [settings, update] = useSettings();
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="border-b-2 border-line bg-surface"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          moreButton.current?.focus();
        }
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2 sm:px-6">
        <LanguageSelect />
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="hidden text-sm font-semibold text-muted sm:inline">
            {t("a11y.textSize")}
          </span>
          <TextSizeControl
            value={settings.textSize}
            onChange={(v) => update({ textSize: v })}
          />
        </div>
        <button
          ref={moreButton}
          type="button"
          aria-expanded={open}
          aria-controls="a11y-more"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-line-strong bg-surface px-2.5 py-2 text-sm font-semibold hover:bg-accent-soft sm:px-3"
        >
          <GearIcon className="h-5 w-5" />
          <span>{t("a11y.more")}</span>
          <ChevronIcon className={`hidden h-4 w-4 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        id="a11y-more"
        role="region"
        aria-label={t("a11y.title")}
        hidden={!open}
        className="max-h-[50dvh] overflow-y-auto border-t-2 border-line"
      >
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:px-6">
          <section className="space-y-2">
            <h2 className="font-bold">{t("a11y.spacing")}</h2>
            <Segmented
              label={t("a11y.spacing")}
              value={settings.spacing}
              onChange={(v) => update({ spacing: v })}
              className="grid grid-cols-3 gap-2 sm:max-w-md"
              options={[
                { value: 0, text: t("a11y.spacing0") },
                { value: 1, text: t("a11y.spacing1") },
                { value: 2, text: t("a11y.spacing2") },
              ]}
            />
          </section>

          <section className="grid gap-2 sm:grid-cols-2">
            {SWITCHES.map((s) => (
              <Switch
                key={s.key}
                label={t(s.label)}
                checked={settings[s.key] as boolean}
                onChange={(v) => update({ [s.key]: v } as Partial<Settings>)}
                onText={t("a11y.on")}
                offText={t("a11y.off")}
              />
            ))}
          </section>

          <section className="flex flex-wrap items-center gap-2 border-t-2 border-line pt-4">
            <button
              type="button"
              onClick={() => settingsStore.set({ ...DEFAULT_SETTINGS, lang: settings.lang })}
              className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-semibold hover:bg-accent-soft"
            >
              {t("a11y.reset")}
            </button>
            <button
              type="button"
              onClick={() => {
                tripStore.reset();
                setCleared(true);
              }}
              className="min-h-12 rounded-xl border-2 border-danger bg-surface px-4 py-2 font-semibold text-danger hover:bg-danger-soft"
            >
              {t("a11y.clearData")}
            </button>
            <p role="status" className="min-h-6 text-base text-muted">
              {cleared ? t("a11y.cleared") : ""}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
