"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, settingsStore, useSettings, type Settings } from "@/lib/settings";
import { tripStore } from "@/lib/trip";
import { useT, type UiKey } from "@/lib/i18n";
import { CloseIcon } from "./Icons";
import { LanguageToggle } from "./LanguageToggle";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Segmented<V extends number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; text: string; ariaLabel?: string; className?: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`min-h-12 rounded-xl border-2 px-2 py-2 font-semibold ${
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

export function AccessibilityPanel({ open, onClose }: Props) {
  const { t } = useT();
  const [settings, update] = useSettings();
  const ref = useRef<HTMLDialogElement>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="a11y-title"
      onClose={onClose}
      onClick={(e) => {
        // Clicks on the dimmed backdrop land on the dialog element itself.
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 m-0 h-dvh max-h-dvh w-full max-w-md overflow-y-auto border-l-2 border-line-strong bg-surface p-0 text-ink"
    >
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="a11y-title" className="text-2xl font-bold">
            {t("a11y.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-semibold hover:bg-accent-soft"
          >
            <CloseIcon className="h-5 w-5" />
            {t("a11y.close")}
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="font-bold">{t("nav.language")}</h3>
          <LanguageToggle />
        </section>

        <section className="space-y-2">
          <h3 className="font-bold">{t("a11y.textSize")}</h3>
          <Segmented
            label={t("a11y.textSize")}
            value={settings.textSize}
            onChange={(v) => update({ textSize: v })}
            options={[
              { value: 0, text: "A", ariaLabel: t("a11y.size0") },
              { value: 1, text: "A+", ariaLabel: t("a11y.size1") },
              { value: 2, text: "A++", ariaLabel: t("a11y.size2") },
              { value: 3, text: "A+++", ariaLabel: t("a11y.size3") },
            ]}
          />
        </section>

        <section className="space-y-2">
          <h3 className="font-bold">{t("a11y.spacing")}</h3>
          <Segmented
            label={t("a11y.spacing")}
            value={settings.spacing}
            onChange={(v) => update({ spacing: v })}
            options={[
              { value: 0, text: t("a11y.spacing0") },
              { value: 1, text: t("a11y.spacing1") },
              { value: 2, text: t("a11y.spacing2") },
            ]}
          />
        </section>

        <section className="space-y-2">
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

        <section className="space-y-3 border-t-2 border-line pt-5">
          <button
            type="button"
            onClick={() => settingsStore.set({ ...DEFAULT_SETTINGS, lang: settings.lang })}
            className="min-h-12 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-semibold hover:bg-accent-soft"
          >
            {t("a11y.reset")}
          </button>
          <button
            type="button"
            onClick={() => {
              tripStore.reset();
              setCleared(true);
            }}
            className="min-h-12 w-full rounded-xl border-2 border-danger bg-surface px-4 py-2 font-semibold text-danger hover:bg-danger-soft"
          >
            {t("a11y.clearData")}
          </button>
          <p role="status" className="min-h-6 text-base text-muted">
            {cleared ? t("a11y.cleared") : ""}
          </p>
        </section>
      </div>
    </dialog>
  );
}
