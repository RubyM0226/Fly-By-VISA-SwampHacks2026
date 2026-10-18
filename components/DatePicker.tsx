"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/journey";
import { ArrowIcon, ChevronIcon } from "./Icons";
import { INTL_LOCALE } from "@/lib/locale";

interface Props {
  id: string;
  /** yyyy-mm-dd or "" */
  value: string;
  /** Earliest day that can be picked, yyyy-mm-dd. */
  min: string;
  onChange: (iso: string) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  /** Set to focus the calendar (for example after a validation error). */
  focusRef?: React.RefObject<{ focus: () => void } | null>;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parts = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
};
const shift = (s: string, days: number) => {
  const { y, m, d } = parts(s);
  const date = new Date(Date.UTC(y, m, d + days));
  return iso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * A large month calendar. Every day is a real button at least 48px square.
 * Arrow keys move by day and week, Page Up/Down by month, Home/End to the
 * week's ends; Enter or Space picks the day.
 */
export function DatePicker({ id, value, min, onChange, labelledBy, describedBy, invalid, focusRef }: Props) {
  const { t, lang } = useT();
  const locale = INTL_LOCALE[lang];

  // The day that holds keyboard focus inside the grid.
  const [active, setActive] = useState(value && value >= min ? value : min);
  // Follow the value when it changes from outside (for example the demo story).
  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    if (value && value >= min) setActive(value);
  }
  const { y, m } = parts(active);
  const gridRef = useRef<HTMLDivElement>(null);

  // Move focus once the day is on screen (it may be in a month that is not rendered yet).
  const pendingFocus = useRef(false);
  const focusDay = (day: string) => {
    const button = gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`);
    if (button) button.focus();
    else pendingFocus.current = true;
  };
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${active}"]`)?.focus();
  }, [active]);
  useImperativeHandle(focusRef, () => ({ focus: () => focusDay(active) }), [active]);

  const moveTo = (day: string, focus = true) => {
    const next = day < min ? min : day;
    setActive(next);
    if (focus) pendingFocus.current = true;
  };
  const moveMonths = (n: number, focus = true) => {
    const target = new Date(Date.UTC(y, m + n, 1));
    const ty = target.getUTCFullYear();
    const tm = target.getUTCMonth();
    moveTo(iso(ty, tm, Math.min(parts(active).d, daysIn(ty, tm))), focus);
  };
  const jumpTo = (ty: number, tm: number) => moveTo(iso(ty, tm, Math.min(parts(active).d, daysIn(ty, tm))), false);

  // Month and year dropdowns, opened from the month title.
  const [pickerOpen, setPickerOpen] = useState(false);
  const minParts = parts(min);
  const years = Array.from({ length: 5 }, (_, i) => minParts.y + i);
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, i, 1))),
  );
  const selectClass =
    "min-h-12 w-full appearance-none rounded-xl border-2 border-line-strong bg-surface py-2 pl-3 pr-9 text-lg font-semibold text-ink hover:bg-hover";

  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m, 1)),
  );
  // Weeks start on Sunday, as on most Indian calendars. 1 Jan 2023 was a Sunday.
  const weekdays = Array.from({ length: 7 }, (_, i) => ({
    short: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i))),
    long: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i))),
  }));
  const lead = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysIn(y, m) }, (_, i) => iso(y, m, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const longDate = (day: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(parts(day).y, parts(day).m, parts(day).d)),
    );
  const canGoBack = iso(y, m, 1) > `${min.slice(0, 8)}01`;

  function onKeyDown(e: React.KeyboardEvent) {
    const dow = new Date(Date.UTC(y, m, parts(active).d)).getUTCDay();
    const keys: Record<string, () => void> = {
      ArrowLeft: () => moveTo(shift(active, -1)),
      ArrowRight: () => moveTo(shift(active, 1)),
      ArrowUp: () => moveTo(shift(active, -7)),
      ArrowDown: () => moveTo(shift(active, 7)),
      Home: () => moveTo(shift(active, -dow)),
      End: () => moveTo(shift(active, 6 - dow)),
      PageUp: () => moveMonths(-1),
      PageDown: () => moveMonths(1),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  }

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`w-full max-w-md rounded-2xl border-2 bg-surface p-2 sm:p-4 ${invalid ? "border-danger" : "border-line-strong"}`}
    >
      <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
        <button
          type="button"
          onClick={() => moveMonths(-1, false)}
          disabled={!canGoBack}
          aria-label={t("start.prevMonth")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong bg-surface hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowIcon className="h-6 w-6 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          aria-expanded={pickerOpen}
          aria-controls={`${id}-pick`}
          className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 justify-self-center rounded-xl px-1 py-1 text-center text-xl font-bold hover:bg-hover sm:px-3"
        >
          <span id={`${id}-month`} aria-live="polite">
            {monthTitle}
          </span>
          <span className="sr-only">, {t("start.chooseMonthYear")}</span>
          <ChevronIcon className={`h-5 w-5 ${pickerOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => moveMonths(1, false)}
          aria-label={t("start.nextMonth")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong bg-surface hover:bg-hover"
        >
          <ArrowIcon className="h-6 w-6" />
        </button>
      </div>

      {pickerOpen && (
        <div id={`${id}-pick`} className="mb-3 grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="block text-sm font-bold text-muted">{t("start.monthLabel")}</span>
            <span className="relative block">
              <select value={m} onChange={(e) => jumpTo(y, Number(e.target.value))} className={selectClass}>
                {monthNames.map((name, i) => (
                  <option key={name} value={i} disabled={y === minParts.y && i < minParts.m}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2" />
            </span>
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-bold text-muted">{t("start.yearLabel")}</span>
            <span className="relative block">
              <select value={y} onChange={(e) => jumpTo(Number(e.target.value), m)} className={selectClass}>
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2" />
            </span>
          </label>
        </div>
      )}

      <div ref={gridRef} role="grid" aria-labelledby={`${id}-month`} onKeyDown={onKeyDown} className="space-y-1">
        <div role="row" className="grid grid-cols-7 gap-1">
          {weekdays.map((w) => (
            <span key={w.long} role="columnheader" aria-label={w.long} className="py-1 text-center text-sm font-bold text-muted">
              {w.short}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-1">
            {week.map((day, di) =>
              day ? (
                <span key={day} role="gridcell" aria-selected={day === value}>
                  <button
                    type="button"
                    data-day={day}
                    tabIndex={day === active ? 0 : -1}
                    disabled={day < min}
                    aria-label={longDate(day)}
                    aria-current={day === value ? "date" : undefined}
                    onClick={() => {
                      setActive(day);
                      onChange(day);
                    }}
                    className={`flex aspect-square min-h-11 w-full items-center justify-center rounded-xl text-lg font-semibold ${
                      day === value
                        ? "bg-accent text-accent-ink"
                        : day < min
                          ? "cursor-not-allowed text-muted opacity-50"
                          : "border-2 border-line bg-surface text-ink hover:border-accent hover:bg-hover"
                    }`}
                  >
                    {parts(day).d}
                  </button>
                </span>
              ) : (
                <span key={`e${wi}-${di}`} role="gridcell" />
              ),
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-lg font-semibold" aria-live="polite">
        {value ? t("start.chosenDate", { date: formatDate(value, lang) }) : t("start.noDate")}
      </p>
    </div>
  );
}
