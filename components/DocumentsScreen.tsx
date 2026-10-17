"use client";

import { useMemo, useState } from "react";
import { DOC_FAQ, searchDocs, type DocAnswer } from "@/content/documentsFaq";
import { useT } from "@/lib/i18n";
import { RichText } from "./Glossary";
import { CloseIcon, ExternalIcon } from "./Icons";

const EXAMPLES: Record<"en" | "hi", string[]> = {
  en: ["DS-160", "Passport photo", "Visa fee receipt", "Invitation letter"],
  hi: ["DS-160", "पासपोर्ट फ़ोटो", "शुल्क रसीद", "निमंत्रण पत्र"],
};

/** Blurb, search box, then one short answer with its official source. */
export function DocumentsScreen() {
  const { t, lang } = useT();
  const [query, setQuery] = useState("");
  // A question picked from a list shows directly, without typing.
  const [picked, setPicked] = useState<DocAnswer | null>(null);

  const results = useMemo(() => searchDocs(query), [query]);
  const answer = picked ?? results[0] ?? null;
  const related = picked ? [] : results.slice(1, 4);
  const searching = query.trim().length > 0 && !picked;

  const pickExample = (text: string) => {
    setPicked(null);
    setQuery(text);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("nav.documents")}</h1>
        <p className="text-lg">{t("docs.blurb")}</p>
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
        <label htmlFor="doc-search" className="block text-lg font-bold">
          {t("docs.searchLabel")}
        </label>
        <div className="relative">
          <input
            id="doc-search"
            type="search"
            value={query}
            onChange={(e) => {
              setPicked(null);
              setQuery(e.target.value);
            }}
            placeholder={t("docs.placeholder")}
            autoComplete="off"
            className="min-h-14 w-full rounded-xl border-2 border-line-strong bg-surface py-3 pl-4 pr-14 text-xl"
          />
          {query && (
            <button
              type="button"
              onClick={() => pickExample("")}
              aria-label={t("docs.clear")}
              className="absolute right-1.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-accent-soft"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base text-muted">{t("docs.try")}</span>
          {EXAMPLES[lang].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => pickExample(ex)}
              className="min-h-11 rounded-full border-2 border-line-strong bg-surface px-4 py-1.5 text-base font-semibold hover:bg-accent-soft"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {/* Announces the answer (or "not found") as people type. */}
      <div aria-live="polite" className="space-y-4">
        {answer && (
          <article aria-labelledby="doc-answer-title" className="space-y-3 rounded-2xl border-2 border-accent bg-surface p-5">
            <h2 id="doc-answer-title" className="text-2xl font-bold">
              {answer.question[lang]}
            </h2>
            <p className="text-lg">
              <RichText text={answer.answer[lang]} />
            </p>
            <p className="text-base">
              <span className="text-muted">{t("docs.source")} </span>
              <a
                href={answer.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 font-semibold text-accent underline"
              >
                {answer.source.label[lang]}
                <ExternalIcon className="h-4 w-4" />
                <span className="sr-only">{t("journey.opensNewTab")}</span>
              </a>
            </p>
          </article>
        )}

        {searching && !answer && (
          <p className="rounded-xl border-2 border-warm-ink bg-warm p-4 text-lg text-warm-ink">{t("docs.noResults")}</p>
        )}
      </div>

      {related.length > 0 && <QuestionList title={t("docs.related")} items={related} onPick={setPicked} />}

      {!searching && <QuestionList title={t("docs.common")} items={DOC_FAQ} onPick={setPicked} current={answer?.id} />}
    </div>
  );
}

function QuestionList({
  title,
  items,
  onPick,
  current,
}: {
  title: string;
  items: DocAnswer[];
  onPick: (d: DocAnswer) => void;
  current?: string;
}) {
  const { lang } = useT();
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="grid gap-2 @3xl:grid-cols-2">
        {items.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onPick(d)}
              aria-current={current === d.id ? "true" : undefined}
              className={`min-h-12 w-full rounded-xl border-2 px-4 py-2 text-left text-lg font-semibold hover:bg-accent-soft ${
                current === d.id ? "border-accent bg-accent-soft" : "border-line-strong bg-surface"
              }`}
            >
              {d.question[lang]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
