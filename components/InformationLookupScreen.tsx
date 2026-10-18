"use client";

import { useEffect, useMemo, useState } from "react";
import { DOC_FAQ, searchDocs, type DocAnswer } from "@/content/documentsFaq";
import type { AskAnswer, AskTurn } from "@/lib/ask";
import type { CorpusHit } from "@/lib/corpusSearch";
import { useT } from "@/lib/i18n";
import { useHome } from "@/lib/homeCountry";
import { plainText, RichText } from "./Glossary";
import { SpeakButton } from "./SpeakButton";
import { CloseIcon, ExternalIcon } from "./Icons";

const EXAMPLES: Record<"en" | "hi", string[]> = {
  en: ["DS-160", "Passport photo", "Visa fee receipt", "Invitation letter"],
  hi: ["DS-160", "पासपोर्ट फ़ोटो", "शुल्क रसीद", "निमंत्रण पत्र"],
};

type Turn = AskTurn & { sources: AskAnswer["sources"] };
const MAX_TURNS = 3;

/**
 * Information Lookup: one box for a question or a document name. Gives one
 * plain answer from the official pages (AI) with its source, then follow-ups
 * in the same place. Without the AI helper it shows the local answers.
 * Kept in memory only.
 */
export function InformationLookupScreen() {
  const { t, lang } = useT();
  const { loc } = useHome();
  const [query, setQuery] = useState("");
  // A question picked from a list shows directly, without typing.
  const [picked, setPicked] = useState<DocAnswer | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [aiOff, setAiOff] = useState(false);

  async function ask() {
    const question = query.trim();
    if (!question || asking) return;
    setAsking(true);
    setAiOff(false);
    let result: AskAnswer | null = null;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang, history: turns.slice(-MAX_TURNS).map(({ question, answer }) => ({ question, answer })) }),
      });
      if (res.ok) result = ((await res.json()) as { result: AskAnswer | null }).result;
    } catch {
      // Offline: the local answers below still work.
    }
    setAsking(false);
    if (!result) return setAiOff(true);
    setTurns((t) => [...t, { question, ...result }]);
    pickExample("");
  }

  const results = useMemo(() => searchDocs(query), [query]);
  const answer = loc(picked ?? results[0] ?? null);
  const related = loc(picked ? [] : results.slice(1, 4));
  const searching = query.trim().length > 0 && !picked;
  // Also look through the official pages. A picked question searches by its text.
  const corpus = useCorpusSearch(picked ? loc(picked.question[lang]) : query);

  const pickExample = (text: string) => {
    setPicked(null);
    setQuery(text);
    setAiOff(false);
  };

  return (
    <div data-hills-peek className="space-y-6 pb-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("nav.infoLookup")}</h1>
        <p className="text-lg">{t("docs.blurb")}</p>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
        className="space-y-3"
      >
        <label htmlFor="doc-search" className="block text-lg font-bold">
          {t("docs.searchLabel")}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
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
              className="absolute right-1.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-hover"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
          </div>
          <button
            type="submit"
            disabled={asking || !query.trim()}
            className="min-h-14 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink hover:opacity-90 disabled:opacity-60"
          >
            {asking ? t("docs.asking") : t("docs.ask")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base text-muted">{t("docs.try")}</span>
          {EXAMPLES[lang].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => pickExample(ex)}
              className="min-h-11 rounded-full border-2 border-line-strong bg-surface px-4 py-1.5 text-base font-semibold hover:bg-hover"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {turns.length > 0 && (
        <section aria-live="polite" className="space-y-4">
          {turns.map((turn, i) => (
            <article key={i} className="space-y-3 rounded-2xl border-2 border-accent bg-surface p-5">
              <p className="text-base">
                <span className="font-bold text-muted">{t("docs.you")}: </span>
                {turn.question}
              </p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg">
                  <RichText text={turn.answer} />
                </p>
                <SpeakButton ownerId={`ask-${i}`} getText={() => plainText(turn.answer)} />
              </div>
              <p className="text-sm text-muted">{t("docs.aiNote")}</p>
              {turn.sources.length > 0 && (
                <ul className="space-y-1">
                  {turn.sources.map((s) => (
                    <li key={s.url}>
                      <span className="text-base text-muted">{t("docs.source")} </span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-1 font-semibold text-accent underline">
                        <span lang="en">{s.title}</span>
                        <ExternalIcon className="h-4 w-4" />
                        <span className="sr-only">{t("journey.opensNewTab")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          <p className="text-base text-muted">{t("docs.followHint")}</p>
          <button
            type="button"
            onClick={() => setTurns([])}
            className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-hover"
          >
            {t("docs.start")}
          </button>
        </section>
      )}

      {aiOff && <p className="rounded-xl border-2 border-line bg-surface p-4 text-base text-muted">{t("docs.aiOff")}</p>}

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

        {searching && !answer && corpus.status === "done" && corpus.hits.length === 0 && (
          <p className="rounded-xl border-2 border-warm-ink bg-warm p-4 text-lg text-warm-ink">{t("docs.noResults")}</p>
        )}
      </div>

      {corpus.status === "loading" && <p className="text-lg text-muted">{t("docs.searching")}</p>}
      {corpus.status === "error" && (
        <p className="rounded-xl border-2 border-warm-ink bg-warm p-4 text-lg text-warm-ink">{t("docs.searchError")}</p>
      )}
      {corpus.hits.length > 0 && <OfficialExcerpts hits={corpus.hits} query={picked ? loc(picked.question).en : query} />}

      {related.length > 0 && <QuestionList title={t("docs.related")} items={related} onPick={setPicked} />}

      {!searching && <QuestionList title={t("docs.common")} items={loc(DOC_FAQ)} onPick={setPicked} current={answer?.id} />}
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
              className={`min-h-12 w-full rounded-xl border-2 px-4 py-2 text-left text-lg font-semibold hover:bg-hover ${
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

type CorpusState = { status: "idle" | "loading" | "done" | "error"; hits: CorpusHit[] };

/** Semantic search over the indexed official pages, once typing pauses. */
function useCorpusSearch(query: string): CorpusState {
  // The last finished search; anything newer is still loading.
  const [result, setResult] = useState<{ q: string; hits: CorpusHit[]; failed: boolean } | null>(null);
  const q = query.trim();
  const active = q.length >= 3;

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const { hits } = (await res.json()) as { hits: CorpusHit[] };
        setResult({ q, hits, failed: false });
      } catch {
        if (!ctrl.signal.aborted) setResult({ q, hits: [], failed: true });
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, active]);

  if (!active) return { status: "idle", hits: [] };
  if (result?.q !== q) return { status: "loading", hits: [] };
  return { status: result.failed ? "error" : "done", hits: result.hits };
}

// Question words that say nothing about what the person is looking for.
const FILLER_WORDS = new Set([
  "what", "how", "the", "and", "for", "can", "does", "need", "about", "with", "you", "your", "are",
  "this", "that", "will", "when", "where", "which", "who", "why", "have", "has", "should", "get", "there",
]);

/** Lower-case words of 3+ letters, with a plural "s" dropped ("passports" -> "passport"). */
function searchTerms(query: string): string[] {
  return (query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])
    .filter((w) => !FILLER_WORDS.has(w))
    .map((w) => w.replace(/s$/, ""));
}

/**
 * Chunks are markdown and start with their section heading. Split that off,
 * turn the rest into plain text, start at the first sentence that mentions a
 * search term (else a clean sentence) and keep it short.
 */
function excerpt(text: string, terms: string[], max = 320): { heading?: string; text: string } {
  // A chunk can start with several heading lines; the last is the closest one.
  const block = text.trim().match(/^(?:#{1,6} .*(?:\n+|$))+/)?.[0] ?? "";
  const heading = block.trim().split("\n").pop()?.replace(/^#{1,6} /, "").trim() || undefined;
  const md = text.trim().slice(block.length);

  let t = md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6} /gm, "")
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "• ")
    .replace(/\s+/g, " ")
    .trim();
  // Jump to the first sentence or list item that mentions what was searched for.
  const lower = t.toLowerCase();
  // Terms are only letters and digits, so they are safe inside a RegExp.
  const hit = Math.min(
    ...terms.map((w) => lower.search(new RegExp(`(?:^|[^\\p{L}\\p{N}])${w}`, "u"))).filter((i) => i >= 0)
  );
  if (Number.isFinite(hit) && hit > 80) {
    const sentence = t.lastIndexOf(". ", hit);
    const start = Math.max(sentence >= 0 ? sentence + 2 : 0, t.lastIndexOf("• ", hit), 0);
    t = "… " + t.slice(start);
  } else if (!/^[A-Z0-9"(•]/.test(t)) {
    // The overlap between chunks can start mid-sentence.
    const cut = t.search(/[.!?:] [A-Z]/);
    if (cut > 0 && cut < 160) t = t.slice(cut + 2);
  }
  if (t.length > max) {
    const end = t.lastIndexOf(" ", max);
    t = t.slice(0, end > 0 ? end : max) + "…";
  }
  return { heading, text: t };
}

function OfficialExcerpts({ hits, query }: { hits: CorpusHit[]; query: string }) {
  const { t } = useT();
  const terms = searchTerms(query);
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{t("docs.official")}</h2>
      <ul className="space-y-3">
        {hits.map((h, i) => {
          const ex = excerpt(h.text, terms);
          return (
            // One page can appear twice (two sections), so the URL alone isn't unique.
            <li key={`${h.url}#${i}`} className="space-y-2 rounded-2xl border-2 border-line-strong bg-surface p-5">
              <h3 className="text-lg font-bold">{h.title}</h3>
              {/* Official pages are in English only. */}
              {ex.heading && ex.heading !== h.title && (
                <p lang="en" className="text-lg font-semibold">
                  {ex.heading}
                </p>
              )}
              <p lang="en" className="text-lg">
                {ex.text}
              </p>
              <p className="flex flex-wrap items-center gap-x-4 text-base">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-1 font-semibold text-accent underline"
                >
                  {t("docs.readFull")}
                  <ExternalIcon className="h-4 w-4" />
                  <span className="sr-only">{t("journey.opensNewTab")}</span>
                </a>
                <span className="text-muted">{t("docs.savedOn", { date: h.savedOn })}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
