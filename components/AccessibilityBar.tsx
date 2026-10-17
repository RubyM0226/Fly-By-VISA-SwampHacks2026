"use client";

import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";
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

/** The same on/off switch, sized for the top row. */
function BarSwitch({
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
      className={`inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-2 bg-surface py-1.5 pl-3 pr-2 text-sm font-semibold hover:bg-accent-soft ${
        checked ? "border-accent" : "border-line-strong"
      }`}
    >
      <span>{label}</span>
      {/* On/Off in words, so state is never colour alone. */}
      <span
        className={`inline-flex min-w-10 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
          checked ? "bg-accent text-accent-ink" : "bg-warm text-warm-ink"
        }`}
      >
        {checked ? onText : offText}
      </span>
    </button>
  );
}

type SwitchKey =
  | "highContrast"
  | "monochrome"
  | "dyslexiaFont"
  | "boldText"
  | "underlineLinks"
  | "highlightLinks"
  | "pauseMotion"
  | "showDefinitions";

const SWITCHES: { key: SwitchKey; label: UiKey }[] = [
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

type BarItemId = "language" | "textSize" | SwitchKey | "spacing";

// Top-row order. As many as fit are shown, from the start of this list;
// the rest move into "More", lowest priority first.
const BAR_ORDER: BarItemId[] = [
  "language",
  "textSize",
  "showDefinitions",
  "dyslexiaFont",
  "highContrast",
  "monochrome",
  "boldText",
  "underlineLinks",
  "highlightLinks",
  "pauseMotion",
  "spacing",
];

/** What fits on the top row: the first `count` of BAR_ORDER, and the logo size. */
interface Fit {
  count: number;
  /** Logo shows just its icon. */
  compact: boolean;
}

/**
 * The top row, always on one line: logo at the far left, as many settings as
 * fit in the middle (in BAR_ORDER), "More" at the far right. Whatever does not
 * fit moves into the "More" panel, along with reset and erase.
 */
export function AccessibilityBar({ start }: { start?: (compact: boolean) => React.ReactNode }) {
  const { t, lang } = useT();
  const [settings, update] = useSettings();
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);

  // Measure the real width of each piece (from hidden copies), then show as
  // much as fits. Re-checked when the screen, language or text settings change.
  const rowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const logoCompactRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fit, setFit] = useState<Fit>({ count: BAR_ORDER.length, compact: false });

  const refit = useCallback(() => {
    const row = rowRef.current;
    const more = moreButton.current;
    const logo = logoRef.current;
    const logoCompact = logoCompactRef.current;
    const items = itemRefs.current.slice(0, BAR_ORDER.length);
    if (!row || !more || !logo || !logoCompact || items.length < BAR_ORDER.length || items.some((el) => !el)) return;
    const style = getComputedStyle(row);
    const space = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap) || 0;
    // How many settings fit next to a logo of this width and the More button.
    const countFor = (logoWidth: number) => {
      let used = logoWidth + gap + more.offsetWidth;
      let n = 0;
      for (const el of items) {
        used += gap + el!.offsetWidth;
        if (used > space) break;
        n++;
      }
      return n;
    };
    const full = countFor(logo.offsetWidth);
    const compactCount = countFor(logoCompact.offsetWidth);
    // Keep the name unless it does not fit at all, or dropping it lets
    // language or text size onto the row.
    const nameFits = logo.offsetWidth + gap + more.offsetWidth <= space;
    const next: Fit =
      nameFits && full >= Math.min(2, compactCount)
        ? { count: full, compact: false }
        : { count: compactCount, compact: true };
    setFit((prev) => (prev.count === next.count && prev.compact === next.compact ? prev : next));
  }, []);

  useLayoutEffect(() => {
    refit();
    // Watch the hidden copies too: they widen when a web font finishes
    // loading, which does not resize the row itself.
    const observer = new ResizeObserver(refit);
    for (const el of [rowRef.current, logoRef.current, logoCompactRef.current, moreButton.current, ...itemRefs.current]) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // Any setting can change how wide the pieces are (text size, font, spacing, On/Off).
  }, [refit, lang, settings]);

  const onBar = (id: BarItemId) => BAR_ORDER.indexOf(id) < fit.count;

  const languageControl = <LanguageSelect />;
  const textSizeControl = <TextSizeControl value={settings.textSize} onChange={(v) => update({ textSize: v })} />;
  const spacingControl = (className: string) => (
    <Segmented
      label={t("a11y.spacing")}
      value={settings.spacing}
      onChange={(v) => update({ spacing: v })}
      className={className}
      options={[
        { value: 0, text: t("a11y.spacing0") },
        { value: 1, text: t("a11y.spacing1") },
        { value: 2, text: t("a11y.spacing2") },
      ]}
    />
  );

  /** One setting as it looks on the top row. */
  const barItem = (id: BarItemId) => {
    if (id === "language") return languageControl;
    if (id === "textSize")
      return (
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="hidden whitespace-nowrap text-sm font-semibold text-muted sm:inline">
            {t("a11y.textSize")}
          </span>
          {textSizeControl}
        </div>
      );
    if (id === "spacing")
      return (
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="whitespace-nowrap text-sm font-semibold text-muted">
            {t("a11y.spacing")}
          </span>
          {spacingControl("flex gap-1 whitespace-nowrap text-sm")}
        </div>
      );
    const label = SWITCHES.find((s) => s.key === id)!.label;
    return (
      <BarSwitch
        label={t(label)}
        checked={settings[id]}
        onChange={(v) => update({ [id]: v } as Partial<Settings>)}
        onText={t("a11y.on")}
        offText={t("a11y.off")}
      />
    );
  };

  return (
    <div
      className="relative border-b-2 border-line bg-surface"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          moreButton.current?.focus();
        }
      }}
    >
      {/* Hidden copies, only for measuring how wide each piece would be. */}
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none invisible absolute left-0 top-0 flex h-0 w-0 overflow-hidden whitespace-nowrap"
      >
        <span ref={logoRef} className="inline-flex shrink-0">
          {start?.(false)}
        </span>
        <span ref={logoCompactRef} className="inline-flex shrink-0">
          {start?.(true)}
        </span>
        {BAR_ORDER.map((id, i) => (
          <span
            key={id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="inline-flex shrink-0"
          >
            {barItem(id)}
          </span>
        ))}
      </div>

      <div ref={rowRef} className="flex flex-nowrap items-center gap-2 overflow-hidden px-3 py-2 sm:px-6">
        <div className="shrink-0">{start?.(fit.compact)}</div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {BAR_ORDER.slice(0, fit.count).map((id) => (
            <Fragment key={id}>{barItem(id)}</Fragment>
          ))}
        </div>
        <button
          ref={moreButton}
          type="button"
          aria-expanded={open}
          aria-controls="a11y-more"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl border-2 border-line-strong bg-surface px-2.5 py-2 text-sm font-semibold hover:bg-accent-soft sm:px-3"
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
        <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Anything that did not fit on the top row lives here instead. */}
          {(!onBar("language") || !onBar("textSize")) && (
            <section className="flex flex-wrap items-end gap-x-6 gap-y-3">
              {!onBar("language") && (
                <div className="space-y-2">
                  <h2 className="font-bold">{t("nav.language")}</h2>
                  {languageControl}
                </div>
              )}
              {!onBar("textSize") && (
                <div className="space-y-2">
                  <h2 className="font-bold">{t("a11y.textSize")}</h2>
                  {textSizeControl}
                </div>
              )}
            </section>
          )}
          {!onBar("spacing") && (
            <section className="space-y-2">
              <h2 className="font-bold">{t("a11y.spacing")}</h2>
              {spacingControl("grid grid-cols-3 gap-2 sm:max-w-md")}
            </section>
          )}

          <section className="grid gap-2 sm:grid-cols-2">
            {SWITCHES.filter((s) => !onBar(s.key)).map((s) => (
              <Switch
                key={s.key}
                label={t(s.label)}
                checked={settings[s.key]}
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
