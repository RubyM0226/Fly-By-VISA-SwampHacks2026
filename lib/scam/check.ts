import { LINKS } from "../config";
import type { Lang } from "../settings";
import { SIGNALS } from "./signals";
import { MatchView, validateMessage, type ValidationResult } from "./text";
import { VERDICTS, type RiskLevel, type ScamCheckResult, type SignalId, type SignalMatch, type Verdict } from "./types";

// Layer 1 of Scam Check: fixed rules, no network, no API key.
//
// PRIVACY: the message is only held in memory while it is checked. Do not
// store it, log it or send it to analytics.

/** At or above this score the verdict is "likely-scam" even without a high signal. */
const SCAM_SCORE = 5;
/** At or above this score the verdict is at least "warning-signs". */
const WARNING_SCORE = 2;
/** Phrases kept per signal, so one noisy signal cannot flood the answer. */
const MAX_PHRASES = 5;

/** Runs every signal over a message that has passed validateMessage(). */
export function checkMessage(text: string): ScamCheckResult {
  const view = new MatchView(text);
  const signals: SignalMatch[] = [];
  const found = new Set<SignalId>();

  // SIGNALS is ordered so that any signal another one `requires` runs first.
  for (const s of SIGNALS) {
    if (s.requires && !s.requires.some((id) => found.has(id))) continue;
    const phrases = dropContained(s.match(view)).slice(0, MAX_PHRASES);
    if (phrases.length === 0) continue;
    found.add(s.id);
    signals.push({ id: s.id, severity: s.severity, weight: s.weight, explanation: s.explanation, phrases });
  }

  const score = signals.reduce((sum, s) => sum + s.weight, 0);
  const verdict: Verdict =
    signals.some((s) => s.severity === "high") || score >= SCAM_SCORE
      ? "likely-scam"
      : score >= WARNING_SCORE
        ? "warning-signs"
        : "cant-tell";

  // Strongest reasons first.
  signals.sort((a, b) => b.weight - a.weight);

  // The rules verdict is the floor: a later layer may raise it, never lower it.
  return { verdict, risk: RISK[verdict], score, signals, floor: verdict };
}

/** Unique phrases, without any that sit inside a longer one ("Rs 500 by UPI" in "pay Rs 500 by UPI"). */
function dropContained(phrases: string[]): string[] {
  const unique = [...new Set(phrases)];
  return unique.filter((p) => !unique.some((q) => q !== p && q.toLowerCase().includes(p.toLowerCase())));
}

export type CheckInputResult =
  | { ok: true; result: ScamCheckResult }
  | Extract<ValidationResult, { ok: false }>;

/** Validates raw input (for example a request body field), then checks it. */
export function checkInput(input: unknown): CheckInputResult {
  const valid = validateMessage(input);
  if (!valid.ok) return valid;
  return { ok: true, result: checkMessage(valid.text) };
}

const RISK: Record<Verdict, RiskLevel> = {
  "cant-tell": "low",
  "warning-signs": "medium",
  "likely-scam": "high",
};

/** True when `a` is a stronger warning than `b`. */
export function isStronger(a: Verdict, b: Verdict): boolean {
  return VERDICTS.indexOf(a) > VERDICTS.indexOf(b);
}

/**
 * Applies the rules floor to a verdict from a later layer (for example an AI
 * review). The answer is never weaker than the floor.
 */
export function enforceFloor(floor: Verdict, proposed: Verdict): Verdict {
  return isStronger(floor, proposed) ? floor : proposed;
}

// NOTE FOR TEAM: the Hindi below is a DRAFT and needs a native Hindi reader.
// Never add a "safe" verdict or wording: we cannot know a message is safe.
export const VERDICT_TEXT: Record<Verdict, { label: Record<Lang, string>; nextSteps: Record<Lang, string[]> }> = {
  "likely-scam": {
    label: { en: "Looks like a scam", hi: "यह धोखा लगता है", es: "Parece una estafa" },
    nextSteps: {
      en: [
        "Do not pay, reply or click any link in this message.",
        "Do not share your passport, OTP, Aadhaar or bank details.",
        "Talk to a family member you trust before you do anything.",
        "Only use the official U.S. government pages, which end in .gov.",
      ],
      hi: [
        "इस संदेश में न पैसे दें, न जवाब दें, न कोई लिंक खोलें।",
        "अपना पासपोर्ट, OTP, आधार या बैंक की जानकारी किसी को न दें।",
        "कुछ भी करने से पहले किसी भरोसेमंद परिवार वाले से बात करें।",
        "सिर्फ़ U.S. सरकार के आधिकारिक पृष्ठ देखें, जो .gov पर खत्म होते हैं।",
      ],
      es: [
        "No pague, no responda ni abra ningún enlace de este mensaje.",
        "No comparta su pasaporte, OTP, Aadhaar ni datos bancarios.",
        "Hable con un familiar de confianza antes de hacer cualquier cosa.",
        "Use solo las páginas oficiales del gobierno de EE. UU., que terminan en .gov.",
      ],
    },
  },
  "warning-signs": {
    label: { en: "Has warning signs", hi: "इसमें चेतावनी के संकेत हैं", es: "Tiene señales de alerta" },
    nextSteps: {
      en: [
        "Do not pay or share any details yet.",
        "Check what it says on the official U.S. government pages, which end in .gov.",
        "Ask a family member you trust to look at it with you.",
      ],
      hi: [
        "अभी न पैसे दें, न कोई जानकारी दें।",
        "जो लिखा है उसे U.S. सरकार के आधिकारिक पृष्ठों (.gov) पर जाँचें।",
        "किसी भरोसेमंद परिवार वाले के साथ इसे देखें।",
      ],
      es: [
        "Todavía no pague ni comparta ningún dato.",
        "Verifique lo que dice en las páginas oficiales del gobierno de EE. UU., que terminan en .gov.",
        "Pida a un familiar de confianza que lo revise con usted.",
      ],
    },
  },
  "cant-tell": {
    label: { en: "We can't tell", hi: "हम पक्का नहीं कह सकते", es: "No podemos saberlo" },
    nextSteps: {
      en: [
        "We did not find clear warning signs, but that does not mean it is real.",
        "Check it yourself on the official pages below before you pay or share anything.",
        "The U.S. government never asks for money by gift card, UPI to a person or cash.",
      ],
      hi: [
        "हमें साफ़ चेतावनी के संकेत नहीं मिले, पर इसका मतलब यह नहीं कि संदेश असली है।",
        "पैसे देने या कोई जानकारी देने से पहले नीचे दिए आधिकारिक पृष्ठों पर खुद जाँचें।",
        "U.S. सरकार कभी गिफ्ट कार्ड, किसी व्यक्ति को UPI या नकद में पैसे नहीं माँगती।",
      ],
      es: [
        "No encontramos señales de alerta claras, pero eso no significa que sea real.",
        "Verifíquelo usted mismo en las páginas oficiales de abajo antes de pagar o compartir algo.",
        "El gobierno de EE. UU. nunca pide dinero con tarjeta de regalo, UPI a una persona ni en efectivo.",
      ],
    },
  },
};

/** Official pages to check against. Shown with every verdict, and required for "cant-tell". */
export const OFFICIAL_LINKS: { label: Record<Lang, string>; url: string }[] = [
  { label: { en: "Visa fraud warning (U.S. State Department)", hi: "वीज़ा धोखाधड़ी की चेतावनी (U.S. विदेश विभाग)", es: "Advertencia sobre fraude de visas (Departamento de Estado de EE. UU.)" }, url: LINKS.fraudWarning },
  { label: { en: "U.S. Embassy in India: visas", hi: "India में U.S. Embassy: वीज़ा", es: "Embajada de EE. UU. en India: visas" }, url: LINKS.embassyIndia },
  { label: { en: "U.S. Embassy in the United Kingdom: visas", hi: "United Kingdom में U.S. Embassy: वीज़ा", es: "Embajada de EE. UU. en el Reino Unido: visas" }, url: LINKS.embassyUK },
  { label: { en: "U.S. Embassy in Mexico: visas", hi: "Mexico में U.S. Embassy: वीज़ा", es: "Embajada de EE. UU. en México: visas" }, url: LINKS.embassyMexico },
  { label: { en: "Visitor visa (official page)", hi: "आगंतुक वीज़ा (आधिकारिक पृष्ठ)", es: "Visa de visitante (página oficial)" }, url: LINKS.visitorVisa },
];
