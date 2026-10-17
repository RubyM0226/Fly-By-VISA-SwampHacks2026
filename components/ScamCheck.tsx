"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { checkMessage, enforceFloor, MAX_MESSAGE_CHARS, OFFICIAL_LINKS, validateMessage, VERDICT_TEXT, type Verdict } from "@/lib/scam";
import { faqAnswer, MAX_FOLLOW_UPS, rulesOnlyResponse, type ScamCheckResponse, type Source, type Turn } from "@/lib/scam/api";
import { EXAMPLES, useScamT, type ScamKey } from "@/lib/scam/strings";
import { plainText, RichText } from "./Glossary";
import { SpeakButton } from "./SpeakButton";
import { AlertIcon, CloseIcon, ExternalIcon } from "./Icons";

// Scam Check, in the left nav: paste a message (or ask about a form) and get
// a plain verdict, reasons, next steps and official links.
//
// PRIVACY: everything lives in this component's memory. Nothing goes to
// localStorage, analytics or logs. "Start over" (or a reload) clears it.

const REQUEST_TIMEOUT_MS = 25_000;

type IconProps = { className?: string };
const ShieldIcon = ({ className }: IconProps) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false} className={className}>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="M12 8v4M12 15.5v.01" />
  </svg>
);
const QuestionIcon = ({ className }: IconProps) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7M12 17v.01" />
  </svg>
);

// The panel is narrow and scrolls, so a floating glossary tooltip would be
// cut off. Show the meaning under the word instead.
const INLINE_TOOLTIPS = "[&_[role=tooltip]]:static [&_[role=tooltip]]:mt-1 [&_[role=tooltip]]:block [&_[role=tooltip]]:w-auto";

// Tablets and up show the panel in the nav; phones open it from the icon rail.
const WIDE = "(min-width: 768px)";
function useWide(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/** The Scam Check entry in the side nav: inline from tablets up, a dialog on phones. */
export function ScamCheckNav() {
  const { st } = useScamT();
  const wide = useWide();
  const state = useScamState();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Close the phone dialog if the screen grows into the inline layout.
  useEffect(() => {
    if (wide && dialog.current?.open) dialog.current.close();
  }, [wide]);

  if (wide) {
    return (
      <div className="flex min-h-40 flex-1 flex-col border-t-2 border-line">
        {/* Scrolls on its own, so the nav links above never move. */}
        {/* relative: keeps sr-only text from stretching the nav's own scroll area. */}
        <div data-scam-scroll className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 ${INLINE_TOOLTIPS}`}>
          <ScamPanel state={state} headingLevel="h2" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-[8px] pt-0">
        <button
          type="button"
          title={st("title")}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            dialog.current?.showModal();
            setOpen(true);
          }}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl p-[8px] text-ink hover:bg-accent-soft"
        >
          <ShieldIcon className="h-6 w-6 shrink-0" />
          <span className="sr-only">{st("open")}</span>
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-label={st("title")}
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 justify-end border-b-2 border-line p-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={st("close")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong hover:bg-accent-soft"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <div data-scam-scroll className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 ${INLINE_TOOLTIPS}`}>
            {open && <ScamPanel state={state} headingLevel="h1" />}
          </div>
        </div>
      </dialog>
    </>
  );
}

interface Result {
  text: string;
  response: ScamCheckResponse;
}

/** All Scam Check state. Kept in memory only. */
function useScamState() {
  const { st, lang } = useScamT();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [followUpBlocked, setFollowUpBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  async function post(body: object): Promise<ScamCheckResponse | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/scam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      return (await res.json()) as ScamCheckResponse;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function check() {
    setError(null);
    const valid = validateMessage(text);
    if (!valid.ok) {
      const msg = valid.error === "too-long" ? st("tooLong", { max: MAX_MESSAGE_CHARS }) : st("empty");
      setError(msg);
      setAnnounce(msg);
      return;
    }
    setBusy(true);
    setAnnounce(st("checking"));
    const fromServer = await post({ text: valid.text, lang, history: [] });
    // Offline or server error: the rules run right here in the browser.
    const response = fromServer ?? rulesOnlyResponse(valid.text, "offline");
    // Never trust a weaker verdict than our own rules give.
    response.verdict = enforceFloor(checkMessage(valid.text).floor, response.verdict);
    setResult({ text: valid.text, response });
    setTurns([]);
    setFollowUpBlocked(false);
    setBusy(false);
    setAnnounce(
      response.kind === "message"
        ? st("announce", { verdict: VERDICT_TEXT[response.verdict].label[lang] })
        : st("announceQuestion"),
    );
  }

  async function askFollowUp(question: string) {
    if (!result || turns.length >= MAX_FOLLOW_UPS) return;
    const valid = validateMessage(question);
    if (!valid.ok) return;
    setBusy(true);
    setAnnounce(st("checking"));
    const res = await post({ text: result.text, lang, history: turns, followUp: valid.text });
    setBusy(false);
    if (!res?.followUpAnswer) {
      setFollowUpBlocked(true);
      setAnnounce(st("followNeedsAi"));
      return;
    }
    setTurns((t) => [...t, { question: valid.text, answer: res.followUpAnswer! }]);
    setAnnounce(st("announceQuestion"));
  }

  function startOver() {
    setText("");
    setResult(null);
    setTurns([]);
    setFollowUpBlocked(false);
    setError(null);
    setAnnounce(st("cleared"));
  }

  function tryExample() {
    const list = EXAMPLES[lang];
    setText(list[exampleIndex % list.length]);
    setExampleIndex((i) => i + 1);
    setError(null);
  }

  return { text, setText, result, turns, followUpBlocked, busy, error, announce, check, askFollowUp, startOver, tryExample };
}

type ScamState = ReturnType<typeof useScamState>;

function ScamPanel({ state, headingLevel }: { state: ScamState; headingLevel: "h1" | "h2" }) {
  const { st } = useScamT();
  const ids = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const Heading = headingLevel;
  const { text, result, busy, error } = state;

  // Bring a new result into view by scrolling the panel only (scrollIntoView
  // would also scroll the nav and the page).
  useEffect(() => {
    const el = resultRef.current;
    const scroller = el?.closest<HTMLElement>("[data-scam-scroll]");
    if (!el || !scroller) return;
    scroller.scrollTop += el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8;
  }, [result]);

  const nearLimit = text.length > MAX_MESSAGE_CHARS * 0.8;

  return (
    <section aria-labelledby={`${ids}-title`} className="space-y-3">
      <Heading id={`${ids}-title`} className="flex items-center gap-2 text-xl font-bold">
        <ShieldIcon className="h-6 w-6 shrink-0" />
        {st("title")}
      </Heading>
      <p className="text-base">{st("intro")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.check();
        }}
        className="space-y-3"
      >
        <label htmlFor={`${ids}-input`} className="block text-base font-bold">
          {st("inputLabel")}
        </label>
        <textarea
          id={`${ids}-input`}
          ref={inputRef}
          value={text}
          onChange={(e) => state.setText(e.target.value)}
          placeholder={st("placeholder")}
          rows={5}
          maxLength={MAX_MESSAGE_CHARS}
          aria-describedby={`${ids}-privacy${error ? ` ${ids}-error` : ""}${nearLimit ? ` ${ids}-count` : ""}`}
          aria-invalid={error ? true : undefined}
          className="block w-full resize-y rounded-xl border-2 border-line-strong bg-surface p-3 text-base"
        />
        {nearLimit && (
          <p id={`${ids}-count`} className="text-sm text-muted">
            {st("count", { n: text.length, max: MAX_MESSAGE_CHARS })}
          </p>
        )}
        {error && (
          <p id={`${ids}-error`} className="rounded-xl border-2 border-danger bg-danger-soft p-3 text-base font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-accent px-4 py-2 text-base font-bold text-accent-ink hover:opacity-90 disabled:opacity-60"
          >
            {busy && !result ? st("checking") : st("check")}
          </button>
          <button
            type="button"
            onClick={() => {
              state.tryExample();
              inputRef.current?.focus();
            }}
            className="min-h-12 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-accent-soft"
          >
            {st("example")}
          </button>
        </div>
        <p id={`${ids}-privacy`} className="text-sm text-muted">
          {st("privacy")}
        </p>
      </form>

      {/* Screen readers hear a short status; the full answer is below. */}
      <p aria-live="polite" className="sr-only">
        {state.announce}
      </p>

      {result && (
        <div ref={resultRef} className="space-y-4">
          {result.response.kind === "message" ? (
            <MessageResult result={result} />
          ) : (
            <QuestionResult result={result} />
          )}
          <FollowUps state={state} />
          <button
            type="button"
            onClick={() => {
              state.startOver();
              inputRef.current?.focus();
            }}
            className="min-h-12 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-accent-soft"
          >
            {st("startOver")}
          </button>
        </div>
      )}
    </section>
  );
}

const VERDICT_STYLE: Record<Verdict, { box: string; Icon: (p: IconProps) => React.ReactElement }> = {
  "likely-scam": { box: "border-danger bg-danger-soft text-danger", Icon: AlertIcon },
  "warning-signs": { box: "border-warm-ink bg-warm text-warm-ink", Icon: AlertIcon },
  "cant-tell": { box: "border-line-strong bg-surface text-ink", Icon: QuestionIcon },
};

function MessageResult({ result }: { result: Result }) {
  const { st, lang } = useScamT();
  const ids = useId();
  const { response } = result;
  const text = VERDICT_TEXT[response.verdict];
  const style = VERDICT_STYLE[response.verdict];
  const summary = response.ai?.summary ?? "";
  const extra = response.ai?.reasons ?? [];
  const steps = text.nextSteps[lang];

  const verdictSpeech = () =>
    [
      text.label[lang],
      plainText(summary),
      st("why"),
      ...response.rules.signals.map((s) => s.explanation[lang]),
      ...extra.map(plainText),
    ]
      .filter(Boolean)
      .join(". ");

  return (
    <>
      <div className={`space-y-2 rounded-2xl border-2 p-3 ${style.box}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="flex min-w-[9rem] flex-1 items-center gap-2 text-xl font-bold">
            <style.Icon className="h-7 w-7 shrink-0" />
            {text.label[lang]}
          </h3>
          <SpeakButton ownerId={`${ids}-verdict`} getText={verdictSpeech} className="text-ink" />
        </div>
        {summary && (
          <div className="space-y-1 text-ink">
            <p className="text-base">
              <RichText text={summary} />
            </p>
            <p className="text-sm text-muted">{st("aiExplains")}</p>
          </div>
        )}
      </div>

      <section aria-labelledby={`${ids}-why`} className="space-y-2">
        <h3 id={`${ids}-why`} className="text-lg font-bold">
          {st("why")}
        </h3>
        {response.rules.signals.length === 0 && extra.length === 0 ? (
          <p className="text-base">{st("whyNone")}</p>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-base">
            {response.rules.signals.map((s) => (
              <li key={s.id}>
                {s.explanation[lang]}
                {s.phrases.length > 0 && (
                  <span className="mt-1 block text-sm">
                    <span className="text-muted">{st("words")} </span>
                    {s.phrases.map((p, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        <q className="font-semibold">{p}</q>
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
            {extra.map((r, i) => (
              <li key={`ai-${i}`}>
                <RichText text={r} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`${ids}-todo`} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${ids}-todo`} className="text-lg font-bold">
            {st("todo")}
          </h3>
          <SpeakButton ownerId={`${ids}-todo`} getText={() => [st("todo"), ...steps].join(". ")} />
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-base">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <OfficialLinks extra={response.ai?.sources ?? []} />
      <ResultNote result={result} />
    </>
  );
}

function QuestionResult({ result }: { result: Result }) {
  const { st, lang } = useScamT();
  const ids = useId();
  const { response } = result;
  const faq = response.ai ? null : faqAnswer(result.text);
  const answer = response.ai?.summary || faq?.answer[lang] || "";
  const sources: Source[] = response.ai?.sources.length
    ? response.ai.sources
    : faq
      ? [{ title: faq.source.label[lang], url: faq.source.url }]
      : [];

  return (
    <>
      <div className="space-y-2 rounded-2xl border-2 border-accent bg-surface p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 id={`${ids}-q`} className="flex min-w-[9rem] flex-1 items-center gap-2 text-xl font-bold">
            <QuestionIcon className="h-7 w-7 shrink-0" />
            {st("aboutQuestion")}
          </h3>
          <SpeakButton ownerId={`${ids}-answer`} getText={() => plainText(answer || st("noAnswer"))} />
        </div>
        <p className="text-base">{answer ? <RichText text={answer} /> : st("noAnswer")}</p>
        {response.ai?.summary && <p className="text-sm text-muted">{st("aiExplains")}</p>}
      </div>
      <OfficialLinks extra={sources} />
      <ResultNote result={result} />
    </>
  );
}

function OfficialLinks({ extra }: { extra: Source[] }) {
  const { st, lang } = useScamT();
  const ids = useId();
  const fixed = OFFICIAL_LINKS.map((l) => ({ title: l.label[lang], url: l.url }));
  const links = [...extra.filter((e) => !fixed.some((f) => f.url === e.url)), ...fixed];
  return (
    <section aria-labelledby={`${ids}-links`} className="space-y-1">
      <h3 id={`${ids}-links`} className="text-lg font-bold">
        {st("official")}
      </h3>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-1 py-1 text-base font-semibold text-accent underline"
            >
              {/* Official pages are in English only. */}
              <span lang={extra.includes(l) ? "en" : undefined}>{l.title}</span>
              <ExternalIcon className="h-4 w-4 shrink-0" />
              <span className="sr-only">{lang === "hi" ? "(नए टैब में खुलता है)" : "(opens in a new tab)"}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultNote({ result }: { result: Result }) {
  const { st } = useScamT();
  const note = result.response.note;
  if (!note) return null;
  return <p className="rounded-xl border-2 border-line bg-surface p-2 text-sm text-muted">{st(`note.${note}` as ScamKey)}</p>;
}

function FollowUps({ state }: { state: ScamState }) {
  const { st } = useScamT();
  const ids = useId();
  const [question, setQuestion] = useState("");
  const { result, turns, followUpBlocked, busy } = state;
  if (!result) return null;

  // Follow-ups need the AI helper; without it, say so once.
  const aiAvailable = result.response.ai !== null && !followUpBlocked;
  const left = MAX_FOLLOW_UPS - turns.length;

  return (
    <div className="space-y-2">
      {turns.length > 0 && (
        <ul className="space-y-3">
          {turns.map((t, i) => (
            <li key={i} className="space-y-1 rounded-xl border-2 border-line bg-surface p-3">
              <p className="text-sm font-bold text-muted">{st("you")}</p>
              <p className="text-base">{t.question}</p>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-bold text-muted">{st("answer")}</p>
                <SpeakButton ownerId={`${ids}-turn-${i}`} getText={() => plainText(t.answer)} />
              </div>
              <p className="text-base">
                <RichText text={t.answer} />
              </p>
            </li>
          ))}
        </ul>
      )}
      {!aiAvailable ? (
        followUpBlocked && <p className="text-sm text-muted">{st("followNeedsAi")}</p>
      ) : left <= 0 ? (
        <p className="text-sm text-muted">{st("followDone")}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!question.trim()) return;
            void state.askFollowUp(question).then(() => setQuestion(""));
          }}
          className="space-y-2"
        >
          <label htmlFor={`${ids}-follow-input`} className="block text-base font-bold">
            {st("followLabel")}
          </label>
          <input
            id={`${ids}-follow-input`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={1000}
            autoComplete="off"
            aria-describedby={`${ids}-left`}
            className="block min-h-12 w-full rounded-xl border-2 border-line-strong bg-surface px-3 text-base"
          />
          <p id={`${ids}-left`} className="text-sm text-muted">
            {st("followLeft", { n: left })}
          </p>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-accent px-4 py-2 text-base font-bold text-accent-ink hover:opacity-90 disabled:opacity-60"
          >
            {busy ? st("checking") : st("followAsk")}
          </button>
        </form>
      )}
    </div>
  );
}
