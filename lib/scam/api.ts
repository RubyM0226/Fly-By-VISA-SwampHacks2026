import type { Lang } from "../settings";
import { checkMessage } from "./check";
import { MAX_MESSAGE_CHARS, validateMessage } from "./text";
import type { ScamCheckResult, Verdict } from "./types";

// What the browser and POST /api/scam-check send each other, plus the
// rules-only answer both sides can build with no network.
//
// PRIVACY: none of this is stored. The browser keeps the conversation in
// memory until "Start over" or a page reload.

/** Follow-up questions allowed after the first answer. */
export const MAX_FOLLOW_UPS = 3;
const MAX_TURN_CHARS = 1000;

export interface Turn {
  question: string;
  answer: string;
}

export interface ScamCheckRequest {
  /** The pasted message (or the text read from a screenshot). */
  text: string;
  lang: Lang;
  /** Earlier follow-ups, oldest first. */
  history: Turn[];
  /** A new follow-up question, if this is one. */
  followUp?: string;
}

/** "question": the text asks something instead of being a message; Scam Check points to Information Lookup. */
export type Kind = "message" | "question";

export interface Source {
  title: string;
  url: string;
}

export interface AiReview {
  /** Plain-language summary of the verdict. */
  summary: string;
  /** Extra warning signs the rules did not list. */
  reasons: string[];
  sources: Source[];
}

/** "offline" is set by the browser when it could not reach the server. */
export type Note = "ai-off" | "ai-failed" | "rate-limited" | "offline";

export interface ScamCheckResponse {
  kind: Kind;
  /** Final verdict for a message, never weaker than rules.floor. */
  verdict: Verdict;
  rules: ScamCheckResult;
  /** null when the AI helper was not used. */
  ai: AiReview | null;
  /** Answer to `followUp`, when one was asked and the AI answered. */
  followUpAnswer?: string;
  /** Set when the answer is rules-only for a reason worth telling the user. */
  note: Note | null;
}

export type ParsedRequest =
  | { ok: true; request: ScamCheckRequest }
  | { ok: false; error: "bad-request" | "empty" | "too-long" | "not-text" | "too-many-follow-ups" };

/** Checks an untrusted request body. */
export function parseRequest(body: unknown): ParsedRequest {
  if (typeof body !== "object" || body === null) return { ok: false, error: "bad-request" };
  const b = body as Record<string, unknown>;
  const valid = validateMessage(b.text);
  if (!valid.ok) return { ok: false, error: valid.error };

  const lang: Lang = b.lang === "hi" ? "hi" : "en";
  const rawHistory = Array.isArray(b.history) ? b.history : [];
  if (rawHistory.length > MAX_FOLLOW_UPS) return { ok: false, error: "too-many-follow-ups" };
  const history: Turn[] = [];
  for (const t of rawHistory) {
    if (typeof t !== "object" || t === null) return { ok: false, error: "bad-request" };
    const { question, answer } = t as Record<string, unknown>;
    if (typeof question !== "string" || typeof answer !== "string") return { ok: false, error: "bad-request" };
    history.push({ question: question.slice(0, MAX_TURN_CHARS), answer: answer.slice(0, MAX_TURN_CHARS) });
  }

  let followUp: string | undefined;
  if (b.followUp !== undefined) {
    if (history.length >= MAX_FOLLOW_UPS) return { ok: false, error: "too-many-follow-ups" };
    const f = validateMessage(b.followUp);
    if (!f.ok) return { ok: false, error: f.error };
    if (f.text.length > MAX_TURN_CHARS) return { ok: false, error: "too-long" };
    followUp = f.text;
  }
  return { ok: true, request: { text: valid.text, lang, history, followUp } };
}

// A short line that asks something, in English, Hindi or Hinglish.
const QUESTION_START =
  /^(what|whats|what's|how|why|when|where|which|who|is|are|do|does|can|should|explain|tell me|meaning|kya|kaise|kab|kahan|kaun|kyun|matlab|क्या|कैसे|कब|कहाँ|कहां|कौन|क्यों|मतलब)(?![\p{L}\p{M}])/iu;

/** Best guess at whether the text is a question rather than a pasted message. */
export function looksLikeQuestion(text: string, rules: ScamCheckResult): boolean {
  if (rules.signals.length > 0) return false;
  const t = text.trim();
  if (t.length > 300) return false;
  return t.endsWith("?") || QUESTION_START.test(t) || /(?<![\p{L}\p{M}])(kya hai|क्या है|matlab|मतलब)/iu.test(t);
}

/** The rules-only answer. Used when the AI helper is off or fails, and by the browser when offline. */
export function rulesOnlyResponse(text: string, note: Note | null): ScamCheckResponse {
  const rules = checkMessage(text);
  return {
    kind: looksLikeQuestion(text, rules) ? "question" : "message",
    verdict: rules.verdict,
    rules,
    ai: null,
    note,
  };
}

export { MAX_MESSAGE_CHARS };
