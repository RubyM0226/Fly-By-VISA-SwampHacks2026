// Input checks and the text helpers the signal matchers use.
//
// PRIVACY: nothing here stores or logs the message. Keep it that way.

export const MAX_MESSAGE_CHARS = 4000;
/** Largest screenshot we read. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
/** Screenshot types we accept. */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type ValidationResult =
  | { ok: true; text: string }
  | { ok: false; error: "not-text" | "empty" | "too-long" };

/** Checks a pasted message and tidies it (Unicode form, line breaks, control characters). */
export function validateMessage(input: unknown): ValidationResult {
  if (typeof input !== "string") return { ok: false, error: "not-text" };
  const text = input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    // Control characters except tab and newline.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (text.length === 0) return { ok: false, error: "empty" };
  if (text.length > MAX_MESSAGE_CHARS) return { ok: false, error: "too-long" };
  return { ok: true, text };
}

// Characters dropped before matching: zero-width characters (used to dodge
// filters) and the Devanagari nukta, so that "वीज़ा" and "वीजा" match alike.
const SKIP = /[​-‍⁠﻿़]/;

/**
 * A copy of the message used for matching, with a map back to the original,
 * so every reported phrase is the user's own words.
 */
export class MatchView {
  readonly original: string;
  readonly text: string;
  private readonly map: number[];

  constructor(original: string) {
    this.original = original;
    let text = "";
    const map: number[] = [];
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      if (SKIP.test(ch)) continue;
      text += ch;
      map.push(i);
    }
    this.text = text;
    this.map = map;
  }

  /** The original words for text[start, end). */
  phrase(start: number, end: number): string {
    if (end <= start) return "";
    return this.original.slice(this.map[start], this.map[end - 1] + 1).trim();
  }

  /** All matches of a regex, with positions in `text`. */
  matches(re: RegExp): { start: number; end: number }[] {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    const out: { start: number; end: number }[] = [];
    for (const m of this.text.matchAll(g)) {
      if (m[0].length === 0) continue;
      out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  }
}

// Word edges that work for Latin and Devanagari (JS \b only knows ASCII).
const B = "(?<![\\p{L}\\p{M}\\p{N}_])";
const E = "(?![\\p{L}\\p{M}\\p{N}_])";

/** Case-insensitive regex for any of the alternatives, as whole words. */
export function words(...alts: string[]): RegExp {
  return new RegExp(`${B}(?:${alts.join("|")})${E}`, "giu");
}

/** Like words(), but the end may run on (for Hindi endings: भेज, भेजें, भेजिए). */
export function prefixes(...alts: string[]): RegExp {
  return new RegExp(`${B}(?:${alts.join("|")})`, "giu");
}

// Words that turn a phrase around: "never pay by gift card", "OTP kisi ko
// na batayein". Hindi and Hinglish put the negation after the noun, English
// puts it before.
const NEG_BEFORE = words(
  "not", "never", "no", "don't", "dont", "do not", "won't", "will not", "cannot", "can't",
  "no one", "nobody", "noone", "beware",
  "mat", "na", "nahi", "nahin", "kabhi", "कभी", "नहीं", "न", "मत",
);
// Only strong negations count after a phrase: Hinglish "bhej do na" is a
// polite "please send", not a "no".
const NEG_AFTER = words("mat", "nahi", "nahin", "नहीं", "मत");
const BEFORE_CHARS = 30;
const AFTER_CHARS = 14;

const SENTENCE_END = /[.!?।\n]/;

function sentenceTail(s: string): string {
  return s.split(SENTENCE_END).pop() ?? "";
}

function sentenceHead(s: string): string {
  return s.split(SENTENCE_END)[0];
}

function test(re: RegExp, s: string): boolean {
  re.lastIndex = 0;
  const hit = re.test(s);
  re.lastIndex = 0;
  return hit;
}

function hasNegation(view: MatchView, start: number, end: number, inside: boolean): boolean {
  const before = sentenceTail(view.text.slice(Math.max(0, start - BEFORE_CHARS), start));
  const after = sentenceHead(view.text.slice(end, end + AFTER_CHARS));
  return (
    test(NEG_BEFORE, before) ||
    test(NEG_AFTER, after) ||
    (inside && test(NEG_BEFORE, view.text.slice(start, end)))
  );
}

export interface FindOptions {
  /** Skip a match when a negation sits next to it ("never pay..."). */
  skipNegated?: boolean;
  /** Also look for a negation inside the match. Use with near() patterns. */
  negationInside?: boolean;
}

/** The original phrases matching any of the regexes, without duplicates. */
export function find(view: MatchView, regexes: RegExp[], opts: FindOptions = {}): string[] {
  const out = new Set<string>();
  for (const re of regexes) {
    for (const { start, end } of view.matches(re)) {
      if (opts.skipNegated && hasNegation(view, start, end, !!opts.negationInside)) continue;
      out.add(view.phrase(start, end));
    }
  }
  return [...out].filter(Boolean);
}

/**
 * A regex for `a` and `b` in either order within one sentence, at most
 * `gap` characters apart. `a` and `b` are regex sources.
 */
export function near(a: string, b: string, gap = 40): RegExp {
  const between = `[^.!?।\\n]{0,${gap}}?`;
  return new RegExp(`${B}(?:(?:${a})${between}(?:${b})|(?:${b})${between}(?:${a}))`, "giu");
}

/** Every web address in the text: with a scheme, with www., or a bare domain. */
export function findLinks(view: MatchView): { phrase: string; host: string }[] {
  const re =
    /(?:https?:\/\/|www\.)[^\s<>"')\]]+|(?<![@\w.-])(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\/[^\s<>"')\]]*)?(?![\w@])/giu;
  const out: { phrase: string; host: string }[] = [];
  for (const { start, end } of view.matches(re)) {
    const phrase = view.phrase(start, end).replace(/[.,;:!?]+$/, "");
    const host = hostOf(phrase);
    // Skip things like "e.g" or "Rs.500" that only look like domains.
    if (!host || !/\.[a-z]{2,24}$/i.test(host) || !/[a-z]/i.test(host.split(".")[0])) continue;
    out.push({ phrase, host });
  }
  return out;
}

function hostOf(link: string): string {
  const withScheme = /^https?:\/\//i.test(link) ? link : `http://${link}`;
  try {
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return "";
  }
}
