"use client";

import { useId, useState } from "react";
import { InfoIcon } from "./Icons";

/** A small "i" button. Hover, tap or keyboard focus shows a short note. */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const open = hover || focus || pinned;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setPinned(false);
          setHover(false);
          setFocus(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          setPinned(false);
        }}
        className="inline-flex h-12 w-12 cursor-help items-center justify-center rounded-full text-accent hover:bg-accent-soft"
      >
        <InfoIcon className="h-7 w-7" />
      </button>
      {/* Always in the DOM so screen readers get the text through aria-describedby. */}
      <span
        id={id}
        role="tooltip"
        hidden={!open}
        className="absolute left-0 top-full z-20 mt-1 w-[min(20rem,80vw)] rounded-lg border-2 border-line-strong bg-surface p-3 text-base font-normal text-ink shadow-lg"
      >
        {children}
      </span>
    </span>
  );
}
