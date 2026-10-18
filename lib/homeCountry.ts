import { LINKS } from "./config";
import { isOrigin, type OriginCode } from "./countries";
import { useSettings, type Lang } from "./settings";
import { useTrip } from "./trip";

// The traveler's home country inside shared content. Steps, documents and
// FAQs are written once with tokens: {home} is the country inside a sentence,
// {vac} the short name of the separate fingerprint centre. India's links are
// swapped for the traveler's own embassy. For India the result is exactly the
// India text. Official names stay in English in every language.

interface HomeInfo {
  /** How the country reads inside a sentence: "in India", "in the United Kingdom". */
  name: Record<Lang, string>;
  /** Shown in the [[vac|...]] glossary chip. */
  vac: string;
  /** India-only link -> this country's link. */
  links: Record<string, string>;
  /** Whole content strings (as written, with tokens) replaced for this country. */
  replace: Record<string, string>;
}

export const HOME: Record<OriginCode, HomeInfo> = {
  IN: { name: { en: "India", hi: "India" }, vac: "VAC", links: {}, replace: {} },
  GB: {
    name: { en: "the United Kingdom", hi: "United Kingdom" },
    vac: "VAC",
    // No passport site guessed: the U.S. Embassy visa page instead.
    links: { [LINKS.embassyIndia]: LINKS.embassyUK, [LINKS.passportIndia]: LINKS.embassyUK },
    // FACT-CHECK: in the UK there is no separate fingerprint (VAC) visit;
    // fingerprints are taken at the embassy on interview day.
    // Hindi is a draft for a native reader.
    replace: {
      "You may also need to visit a [[vac|{vac}]] first, for fingerprints.":
        "In the United Kingdom there is usually no separate fingerprint visit. Your fingerprints are taken at your interview.",
      "शायद पहले उंगलियों के निशान के लिए [[vac|{vac}]] भी जाना पड़े।":
        "United Kingdom में आमतौर पर उंगलियों के निशान के लिए अलग से नहीं जाना पड़ता। निशान इंटरव्यू के समय ही लिए जाते हैं।",
      "What is the {vac} visit?": "Do I need a separate fingerprint visit?",
      "{vac} जाना क्या होता है?": "क्या उंगलियों के निशान के लिए अलग से जाना होगा?",
      "Many people in {home} first visit a [[vac|{vac}]], where your fingerprints and photo are taken. Then you go to your interview. Bring your passport and appointment letter.":
        "In the United Kingdom there is usually no separate fingerprint visit. Your fingerprints and photo are taken at the U.S. Embassy in London on the day of your interview. Bring your passport and appointment letter.",
      "{home} में कई लोग पहले [[vac|{vac}]] जाते हैं, जहाँ उंगलियों के निशान और फ़ोटो लिए जाते हैं। फिर इंटरव्यू होता है। पासपोर्ट और अपॉइंटमेंट पत्र साथ ले जाएँ।":
        "United Kingdom में आमतौर पर उंगलियों के निशान के लिए अलग से नहीं जाना पड़ता। London में U.S. Embassy में इंटरव्यू के दिन ही उंगलियों के निशान और फ़ोटो लिए जाते हैं। पासपोर्ट और अपॉइंटमेंट पत्र साथ ले जाएँ।",
    },
  },
  MX: {
    name: { en: "Mexico", hi: "Mexico" },
    // Mexico's separate fingerprint appointment is at a CAS (Centro de Atención a Solicitantes).
    vac: "CAS",
    links: { [LINKS.embassyIndia]: LINKS.embassyMexico, [LINKS.passportIndia]: LINKS.embassyMexico },
    replace: {},
  },
};

/** `value` with every string written for this home country. Infers the language from en/hi keys. */
export function localize<T>(value: T, from: string, lang: Lang = "en"): T {
  const home = HOME[isOrigin(from) ? from : "IN"];
  if (typeof value === "string") {
    const s = home.replace[value] ?? value;
    return (home.links[s] ?? s.replaceAll("{home}", home.name[lang]).replaceAll("{vac}", home.vac)) as T;
  }
  if (Array.isArray(value)) return value.map((v) => localize(v, from, lang)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, localize(v, from, k === "en" || k === "hi" ? k : lang)]),
    ) as T;
  }
  return value;
}

/** The traveler's home country (India until one is chosen) and a content localizer. `from` overrides the trip. */
export function useHome(from?: string) {
  const [trip] = useTrip();
  const [settings] = useSettings();
  const raw = from ?? trip.from;
  const code: OriginCode = isOrigin(raw) ? raw : "IN";
  return {
    code,
    name: HOME[code].name[settings.lang],
    loc: <T,>(value: T) => localize(value, code, settings.lang),
  };
}
