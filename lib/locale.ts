import type { Lang } from "./settings";

// One place for everything that depends on the site language but is not text:
// number and date formats, the voice used for read-aloud, and the language
// name we give the AI. Add a new language here first.

export const LANGS: readonly Lang[] = ["en", "hi", "es"];

/** For Intl date and number formatting. */
export const INTL_LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", es: "es-419" };

/** For read-aloud voices. */
export const SPEECH_TAG: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", es: "es-US" };

/** Tells the AI which language to reply in. */
export const AI_REPLY_LANGUAGE: Record<Lang, string> = {
  en: "simple English",
  hi: "Hindi in Devanagari script (simple everyday Hindi)",
  es: "simple, clear Spanish (neutral Latin American, formal 'usted')",
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}
