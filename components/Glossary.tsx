"use client";

import { Fragment, useId, useState } from "react";
import { GLOSSARY } from "@/content/glossary";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";

/** A word with a tappable, hoverable plain-language meaning. */
export function GlossaryTerm({ termKey, children }: { termKey: string; children: React.ReactNode }) {
  const { t, lang } = useT();
  const [settings] = useSettings();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const entry = GLOSSARY[termKey];

  if (!entry || !settings.showDefinitions) return <>{children}</>;

  const open = hover || pinned;
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setPinned(false);
          setHover(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        aria-label={t("glossary.open", { term: typeof children === "string" ? children : entry.term[lang] })}
        onClick={() => setPinned((p) => !p)}
        className="cursor-help font-semibold underline decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-[min(18rem,80vw)] rounded-lg border-2 border-line-strong bg-surface p-3 text-base font-normal text-ink shadow-lg"
        >
          {entry.definition[lang]}
        </span>
      )}
    </span>
  );
}

/** Renders text, turning [[key|Shown text]] into glossary terms. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[\[[a-z0-9]+\|[^\]]+\]\])/gi);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[\[([a-z0-9]+)\|([^\]]+)\]\]$/i.exec(part);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        return (
          <GlossaryTerm key={i} termKey={m[1]}>
            {m[2]}
          </GlossaryTerm>
        );
      })}
    </>
  );
}

/** Same text without markup, for read aloud. */
export function plainText(text: string): string {
  return text.replace(/\[\[[a-z0-9]+\|([^\]]+)\]\]/gi, "$1");
}
