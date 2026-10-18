"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { enforceFloor, IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_MESSAGE_CHARS, OFFICIAL_LINKS, validateMessage, VERDICT_TEXT, type Verdict } from "@/lib/scam";
import { MAX_FOLLOW_UPS, rulesOnlyResponse, type ScamCheckResponse, type Source, type Turn } from "@/lib/scam/api";
import { useScamT, type ScamKey } from "@/lib/scam/strings";
import { plainText, RichText } from "./Glossary";
import { SpeakButton } from "./SpeakButton";
import { AlertIcon, ExternalIcon, QuestionIcon, ShieldIcon } from "./Icons";

// Scam Check, its own page: paste a message (or add a screenshot of it) and
// get a plain verdict, reasons, next steps and official links. It only checks
// for scams; questions go to Information Lookup.
//
// PRIVACY: everything lives in this component's memory. Nothing goes to
// localStorage, analytics or logs. The screenshot is sent to the server to
// read its text and is never saved. "Start over" (or a reload) clears it.

const REQUEST_TIMEOUT_MS = 40_000;

type IconProps = { className?: string };

// Glossary tooltips would float out of a narrow column. Show the meaning under the word instead.
const INLINE_TOOLTIPS = "[&_[role=tooltip]]:static [&_[role=tooltip]]:mt-1 [&_[role=tooltip]]:block [&_[role=tooltip]]:w-auto";

/** The Scam Check page. Open to everyone, signed in or not. */
export function ScamCheckScreen() {
  const state = useScamState();
  return (
    <div data-hills-peek className={`mx-auto max-w-3xl pb-6 ${INLINE_TOOLTIPS}`}>
      <ScamPanel state={state} />
    </div>
  );
}

interface Result {
  text: string;
  /** True when a screenshot was checked. */
  image: boolean;
  response: ScamCheckResponse;
}

// Server error code -> message.
const IMAGE_ERRORS: Record<string, ScamKey> = {
  "image-unavailable": "imageOff",
  "no-text": "imageNoText",
  "image-too-large": "imageBig",
  "bad-image": "imageBad",
  "rate-limited": "imageLimit",
  "image-failed": "imageFailed",
};

/** All Scam Check state. Kept in memory only. */
function useScamState() {
  const { st, lang } = useScamT();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [followUpBlocked, setFollowUpBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  /** `error` is the server's code, or null when it could not be reached. */
  async function post(body: object | FormData): Promise<{ response: ScamCheckResponse } | { error: string | null }> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const form = body instanceof FormData;
      const res = await fetch("/api/scam-check", {
        method: "POST",
        headers: form ? undefined : { "Content-Type": "application/json" },
        body: form ? body : JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) return { error: ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "" };
      return { response: (await res.json()) as ScamCheckResponse };
    } catch {
      return { error: null };
    } finally {
      clearTimeout(timer);
    }
  }

  function fail(msg: string) {
    setError(msg);
    setAnnounce(msg);
    setBusy(false);
  }

  async function check() {
    setError(null);
    const hasText = text.trim().length > 0;
    const valid = hasText ? validateMessage(text) : null;
    if (valid && !valid.ok) return fail(valid.error === "too-long" ? st("tooLong", { max: MAX_MESSAGE_CHARS }) : st("empty"));
    if (!valid && !image) return fail(st("empty"));
    if (image && !(IMAGE_TYPES as readonly string[]).includes(image.type)) return fail(st("imageBad"));
    if (image && image.size > MAX_IMAGE_BYTES) return fail(st("imageBig"));

    setBusy(true);
    setAnnounce(st("checking"));
    const typed = valid?.ok ? valid.text : "";
    const form = new FormData();
    if (image) {
      form.set("text", typed);
      form.set("lang", lang);
      form.set("image", image);
    }
    const posted = await post(image ? form : { text: typed, lang, history: [] });

    let response: ScamCheckResponse;
    if ("response" in posted) response = posted.response;
    else if (image) return fail(st(posted.error === "too-long" ? "tooLong" : (IMAGE_ERRORS[posted.error ?? ""] ?? "imageFailed"), { max: MAX_MESSAGE_CHARS }));
    // Offline or server error: the rules run right here in the browser.
    else response = rulesOnlyResponse(typed, "offline");
    // Never trust a weaker verdict than our own rules give.
    response.verdict = enforceFloor(response.rules.floor, response.verdict);
    setResult({ text: typed, image: Boolean(image), response });
    setTurns([]);
    setFollowUpBlocked(false);
    setBusy(false);
    setAnnounce(response.kind === "message" ? st("announce", { verdict: VERDICT_TEXT[response.verdict].label[lang] }) : st("question"));
  }

  async function askFollowUp(question: string) {
    if (!result || turns.length >= MAX_FOLLOW_UPS) return;
    const valid = validateMessage(question);
    if (!valid.ok) return;
    setBusy(true);
    setAnnounce(st("checking"));
    const posted = await post({ text: result.text, lang, history: turns, followUp: valid.text });
    setBusy(false);
    const answer = "response" in posted ? posted.response.followUpAnswer : undefined;
    if (!answer) {
      setFollowUpBlocked(true);
      setAnnounce(st("followNeedsAi"));
      return;
    }
    setTurns((t) => [...t, { question: valid.text, answer }]);
    setAnnounce(st("announceQuestion"));
  }

  function startOver() {
    setText("");
    setImage(null);
    setResult(null);
    setTurns([]);
    setFollowUpBlocked(false);
    setError(null);
    setAnnounce(st("cleared"));
  }

  return { text, setText, image, setImage, result, turns, followUpBlocked, busy, error, announce, check, askFollowUp, startOver };
}

type ScamState = ReturnType<typeof useScamState>;

function ScamPanel({ state }: { state: ScamState }) {
  const { st } = useScamT();
  const ids = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { text, image, result, busy, error } = state;

  // Bring a new result into view.
  useEffect(() => {
    resultRef.current?.scrollIntoView({ block: "start" });
  }, [result]);

  const nearLimit = text.length > MAX_MESSAGE_CHARS * 0.8;

  return (
    <section aria-labelledby={`${ids}-title`} className="space-y-4">
      <h1 id={`${ids}-title`} className="flex items-center gap-2 text-3xl font-bold">
        <ShieldIcon className="h-8 w-8 shrink-0" />
        {st("title")}
      </h1>
      <p className="text-lg">{st("intro")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.check();
        }}
        className="space-y-3"
      >
        <label htmlFor={`${ids}-input`} className="block text-lg font-bold">
          {st("inputLabel")}
        </label>
        <textarea
          id={`${ids}-input`}
          ref={inputRef}
          value={text}
          onChange={(e) => state.setText(e.target.value)}
          placeholder={st("placeholder")}
          rows={6}
          maxLength={MAX_MESSAGE_CHARS}
          aria-describedby={`${ids}-privacy${error ? ` ${ids}-error` : ""}${nearLimit ? ` ${ids}-count` : ""}`}
          aria-invalid={error ? true : undefined}
          className="block w-full resize-y rounded-xl border-2 border-line-strong bg-surface p-3 text-lg"
        />
        {nearLimit && (
          <p id={`${ids}-count`} className="text-sm text-muted">
            {st("count", { n: text.length, max: MAX_MESSAGE_CHARS })}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor={`${ids}-image`} className="block text-lg font-bold">
            {st("imageLabel")}
          </label>
          <p id={`${ids}-image-hint`} className="text-base text-muted">
            {st("imageHint")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* A real file input stays keyboard- and screen-reader-friendly. */}
            <input
              id={`${ids}-image`}
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-describedby={`${ids}-image-hint`}
              onChange={(e) => state.setImage(e.target.files?.[0] ?? null)}
              className="min-h-12 max-w-full text-base file:mr-3 file:min-h-12 file:rounded-xl file:border-2 file:border-line-strong file:bg-surface file:px-4 file:py-2 file:font-semibold hover:file:bg-hover"
            />
            {image && (
              <button
                type="button"
                onClick={() => {
                  state.setImage(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-hover"
              >
                {st("imageRemove")}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p id={`${ids}-error`} role="alert" className="rounded-xl border-2 border-danger bg-danger-soft p-3 text-base font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink hover:opacity-90 disabled:opacity-60 sm:flex-1"
          >
            {busy && !result ? st("checking") : st("check")}
          </button>
        </div>
        <p id={`${ids}-privacy`} className="text-base text-muted">
          {st("privacy")}
        </p>
      </form>

      {/* Screen readers hear a short status; the full answer is below. */}
      <p aria-live="polite" className="sr-only">
        {state.announce}
      </p>

      {result && (
        <div ref={resultRef} className="scroll-mt-24 space-y-4">
          {result.response.kind === "message" ? <MessageResult result={result} /> : <QuestionResult />}
          <FollowUps state={state} />
          <button
            type="button"
            onClick={() => {
              state.startOver();
              inputRef.current?.focus();
            }}
            className="min-h-12 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base font-semibold hover:bg-hover sm:w-auto"
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

  return (
    <>
      <div className={`space-y-2 rounded-2xl border-2 p-3 ${style.box}`}>
        <h3 className="flex min-h-12 items-center justify-center gap-2 text-center text-xl font-bold">
          <style.Icon className="h-7 w-7 shrink-0" />
          {text.label[lang]}
        </h3>
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

/** Not a message to check: point to Information Lookup. */
function QuestionResult() {
  const { st } = useScamT();
  return (
    <div className="space-y-2 rounded-2xl border-2 border-accent bg-surface p-4">
      <p className="flex items-start gap-2 text-lg">
        <QuestionIcon className="mt-0.5 h-7 w-7 shrink-0" />
        {st("question")}
      </p>
      <Link href="/information-lookup" className="inline-flex min-h-12 items-center font-semibold text-accent underline">
        {st("questionLink")}
      </Link>
    </div>
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
              <span className="sr-only">{lang === "hi" ? "(नए टैब में खुलता है)" : lang === "es" ? "(se abre en una pestaña nueva)" : "(opens in a new tab)"}</span>
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
  // Not for screenshots: a follow-up would not have the picture.
  if (!result || result.image) return null;

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
