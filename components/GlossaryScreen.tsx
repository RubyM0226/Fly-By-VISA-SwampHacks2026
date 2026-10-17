"use client";

import { useMemo, useState } from "react";
import { normalize } from "@/content/documentsFaq";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory, type GlossaryEntry } from "@/content/glossary";
import { useT } from "@/lib/i18n";
import { CloseIcon } from "./Icons";
import { SpeakButton } from "./SpeakButton";

type Item = GlossaryEntry & { key: string };

const ENTRIES: Item[] = Object.entries(GLOSSARY).map(([key, e]) => ({ key, ...e }));
const squash = (text: string) => normalize(text).replace(/\s+/g, "");

/** Every word, grouped by category and sorted A–Z, with a filter box. */
export function GlossaryScreen() {
  const { t, lang } = useT();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    // "ds160" should find "DS-160", so compare with spaces and dashes removed too.
    const q = normalize(query);
    const qs = squash(query);
    const matches = (e: Item) => {
      if (!q) return true;
      const hay = normalize(`${e.term[lang]} ${e.definition[lang]}`);
      return hay.includes(q) || hay.replace(/\s+/g, "").includes(qs);
    };
    return GLOSSARY_CATEGORIES.map((cat) => ({
      cat,
      items: ENTRIES.filter((e) => e.category === cat && matches(e)).sort((a, b) =>
        a.term[lang].localeCompare(b.term[lang], lang),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query, lang]);

  const searching = query.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("nav.glossary")}</h1>
        <p className="text-lg">{t("glossary.blurb")}</p>
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
        <label htmlFor="glossary-search" className="block text-lg font-bold">
          {t("glossary.searchLabel")}
        </label>
        <div className="relative">
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("glossary.placeholder")}
            autoComplete="off"
            className="min-h-14 w-full rounded-xl border-2 border-line-strong bg-surface py-3 pl-4 pr-14 text-xl"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("docs.clear")}
              className="absolute right-1.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-accent-soft"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {groups.length > 0 && (
        <nav aria-label={t("glossary.jumpTo")}>
          <ul className="flex flex-wrap gap-2">
            {groups.map(({ cat }) => (
              <li key={cat}>
                <a
                  href={`#cat-${cat}`}
                  className="inline-flex min-h-12 items-center rounded-full border-2 border-line-strong bg-surface px-4 py-1.5 text-base font-semibold hover:bg-accent-soft"
                >
                  {t(`glossary.cat.${cat}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Announces "nothing found" as people type. */}
      <div aria-live="polite">
        {searching && groups.length === 0 && (
          <p className="rounded-xl border-2 border-warm-ink bg-warm p-4 text-lg text-warm-ink">{t("glossary.noResults")}</p>
        )}
      </div>

      {groups.map(({ cat, items }) => (
        <Category key={cat} cat={cat} items={items} />
      ))}
    </div>
  );
}

function Category({ cat, items }: { cat: GlossaryCategory; items: Item[] }) {
  const { t, lang } = useT();
  const title = t(`glossary.cat.${cat}`);
  const readText = [title, ...items.map((e) => `${e.term[lang]}. ${e.definition[lang]}`)].join(". ");

  return (
    <section aria-labelledby={`cat-${cat}`} className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 id={`cat-${cat}`} className="text-2xl font-bold">
          {title}
        </h2>
        <SpeakButton ownerId={`glossary-${cat}`} getText={() => readText} />
      </div>
      <dl className="grid gap-3 @3xl:grid-cols-2">
        {items.map((e) => (
          <div
            key={e.key}
            id={e.key}
            className="space-y-1 rounded-xl border-2 border-line-strong bg-surface p-4 target:border-accent target:bg-accent-soft"
          >
            <dt className="text-xl font-bold">{e.term[lang]}</dt>
            <dd className="text-lg">{e.definition[lang]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
