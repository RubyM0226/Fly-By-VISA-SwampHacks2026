import type { Lang } from "../settings";
import type { Severity, SignalId } from "./types";
import { find, findLinks, near, prefixes, words, type MatchView } from "./text";

// The warning signs Scam Check looks for, in English, Hindi (Devanagari) and
// Hinglish. Each matcher returns the exact phrases it found; an empty list
// means no match.
//
// Facts: the U.S. government never asks for visa fees by gift card, UPI to a
// person, crypto or cash; no one can guarantee a visa; officials do not use
// WhatsApp. See LINKS.fraudWarning in lib/config.ts.
//
// Links: U.S. government sites end in .gov. Do NOT add any other "official"
// domain here. The India booking portal is still marked VERIFY in
// content/steps.ts.
//
// NOTE FOR TEAM: every Hindi explanation below is a DRAFT and needs a native
// Hindi reader before the demo.

export interface Signal {
  id: SignalId;
  severity: Severity;
  /** Added up across matched signals to set the verdict. */
  weight: number;
  explanation: Record<Lang, string>;
  /** Only checked when one of these signals already matched. */
  requires?: SignalId[];
  match: (view: MatchView) => string[];
}

// Pieces shared by several matchers (regex sources).
const VISA = "visa|visas|वीजा|वीसा|बीजा";
const LETTERS = "[\\p{L}\\p{M}]*";

const AMOUNT =
  "(?:₹|rs\\.?|inr|usd|\\$)\\s?\\d[\\d,]*" +
  "|\\d[\\d,]*\\s?(?:rs|rupees?|rupaye|rupay|रुपये|रुपए|रु|हजार|hazaa?r|k|lakh|लाख|dollars?|usd)(?![\\p{L}])";

const PAY_VERB = [
  "pay", "paying", "paid", "payment", "send", "transfer", "deposit", "scan", "buy", "purchase", "recharge",
  "bhej" + LETTERS, "jama", "de do", "dedo", "dijiye", "kar do", "karo", "karein", "bharo", "bhariye",
  "भेज" + LETTERS, "भुगतान", "जमा", "दे दें", "दीजिए", "करें", "खरीद" + LETTERS,
].join("|");

const PAY_METHOD = [
  "gift ?cards?", "google ?play(?: cards?| codes?| vouchers?)?", "amazon (?:gift )?(?:cards?|vouchers?|pay)",
  "itunes(?: cards?)?", "steam cards?", "vouchers?", "upi(?: id)?", "g ?pay", "google pay", "phone ?pe", "paytm",
  "bhim", "qr code", "wire transfer", "western union", "money ?gram", "bitcoins?", "btc", "crypto" + LETTERS,
  "usdt", "binance", "cash", "nakad", "personal account", "my account", "this account", "(?:is|iss) account",
  "account (?:number|no\\.?)", "a/c",
  "नकद", "कैश", "यूपीआई", "गूगल पे", "फोनपे", "पेटीएम", "गिफ्ट कार्ड", "मेरे खाते", "इस खाते",
].join("|");

const UPI_HANDLE =
  /[\w.-]{2,}@(?:ybl|ibl|axl|upi|paytm|okaxis|oksbi|okhdfcbank|okicici|apl|axisbank|icici|sbi|hdfcbank|kotak|yesbank|fbl)(?!\w|\.\w)/giu;

const ASK_VERB = [
  "send", "share", "tell", "forward", "reply(?: with)?", "whats ?app",
  "bhej" + LETTERS, "bata" + LETTERS, "de do", "dedo", "dijiye", "dena", "share kar" + LETTERS,
  "भेज" + LETTERS, "बता" + LETTERS, "शेयर", "दें", "दीजिए", "दे दें", "लिख" + LETTERS,
].join("|");

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc",
  "rebrand.ly", "buff.ly", "t.ly", "s.id", "v.gd", "lnkd.in", "shorte.st", "bitly.com", "tinyurl.in",
];

export const SIGNALS: Signal[] = [
  {
    id: "payment-method",
    severity: "high",
    weight: 5,
    explanation: {
      en: "It asks you to pay by gift card, UPI, wire transfer, crypto or cash to a person. Visa fees are never paid this way.",
      hi: "इसमें गिफ्ट कार्ड, UPI, वायर ट्रांसफर, क्रिप्टो या किसी व्यक्ति को नकद देने को कहा गया है। वीज़ा शुल्क कभी इस तरह नहीं दिया जाता।",
    },
    match: (v) => [
      ...find(v, [near(PAY_METHOD, PAY_VERB, 40), near(PAY_METHOD, AMOUNT, 30)], {
        skipNegated: true,
        negationInside: true,
      }),
      ...find(v, [UPI_HANDLE]),
    ],
  },
  {
    id: "guarantee",
    severity: "high",
    weight: 5,
    explanation: {
      en: "It promises a guaranteed visa or interview slot. No one can promise this. Only the officer at your interview decides.",
      hi: "इसमें पक्का वीज़ा या पक्के इंटरव्यू स्लॉट का वादा है। ऐसा वादा कोई नहीं कर सकता। फ़ैसला सिर्फ़ इंटरव्यू वाले अधिकारी करते हैं।",
    },
    match: (v) =>
      find(
        v,
        [
          near(
            "guarantee[ds]?|गारंटी|gaurantee[ds]?",
            `${VISA}|interview|slot|appointment|approval|इंटरव्यू|स्लॉट|अपॉइंटमेंट`,
            30,
          ),
          words(
            "100\\s?%\\s?(?:visa|approval|success|guarantee|pakka|confirm" + LETTERS + ")",
            `(?:${VISA})\\s(?:pakka|confirm|sure)`,
            `(?:pakka|confirm|sure ?shot)\\s(?:${VISA})`,
            "पक्का (?:वीजा|वीसा)", "(?:वीजा|वीसा) पक्का", "no rejection", "zero rejection",
          ),
        ],
        { skipNegated: true, negationInside: true },
      ),
  },
  {
    id: "pay-to-speed-up",
    severity: "high",
    weight: 5,
    explanation: {
      en: "It offers to speed up or fast-track your appointment for money. Earlier dates cannot be bought.",
      hi: "इसमें पैसे लेकर अपॉइंटमेंट जल्दी दिलाने की बात है। जल्दी की तारीख खरीदी नहीं जा सकती।",
    },
    match: (v) => {
      const slot = "appointment|slot|date|interview|visa|अपॉइंटमेंट|स्लॉट|तारीख|डेट|इंटरव्यू|वीजा";
      const speed = [
        "fast[- ]?track" + LETTERS, "speed(?:ing)? up", "expedit" + LETTERS, "prepone" + LETTERS,
        `(?:early|earlier|earliest|urgent|quick|priority|vip|nearest)\\s(?:${slot})`,
        `(?:jaldi|jldi|turant|जल्दी|तुरंत)\\s(?:${slot})`, `(?:${slot})\\s(?:jaldi|jldi|जल्दी)`,
        "slot (?:book|dila)" + LETTERS, "appointment dila" + LETTERS,
        "पहले की (?:तारीख|अपॉइंटमेंट|डेट)",
      ].join("|");
      const money = `${AMOUNT}|extra (?:fee|charge|payment|amount)s?|service charges?|charges?|fees?|paise|paisa|पैसे|शुल्क|फीस|pay|payment|kharcha|खर्च`;
      // The offer and the price are often in different sentences, so look
      // for both anywhere in the message.
      const offers = find(v, [words(speed)], { skipNegated: true });
      if (offers.length === 0) return [];
      const prices = find(v, [words(money)], { skipNegated: true });
      return prices.length ? [...offers, ...prices] : [];
    },
  },
  {
    id: "fake-official-channel",
    severity: "high",
    weight: 5,
    explanation: {
      en: "Someone says they are from the U.S. Embassy or Consulate but wants you on WhatsApp, Telegram or a personal number. Real officials do not do this.",
      hi: "कोई खुद को U.S. Embassy या कांसुलेट का बताता है, पर WhatsApp, Telegram या निजी नंबर पर बात करना चाहता है। असली अधिकारी ऐसा नहीं करते।",
    },
    match: (v) => {
      const office = "embassy|consulate|state department|uscis|visa (?:office|department|section)|immigration (?:office|department)|दूतावास|एम्बेसी|कांसुलेट";
      const claims = find(v, [
        new RegExp(
          `(?:i am|i'm|im|this is|we are|we're|calling from|writing from|message from|on behalf of|speaking from|main|mai|hum|मैं|हम)[^.!?।\\n]{0,40}?(?:${office})`,
          "giu",
        ),
        new RegExp(`(?:${office})\\s?(?:se|से)\\s?(?:bol|baat|बोल|बात)`, "giu"),
        new RegExp(`(?:officer|official|agent|adhikari|अधिकारी)[^.!?।\\n]{0,30}?(?:from|se|से)[^.!?।\\n]{0,12}?(?:${office})`, "giu"),
        new RegExp(`(?:${office})[^.!?।\\n]{0,15}?(?:ka|ki|के|का|की)\\s(?:officer|official|adhikari|अधिकारी)`, "giu"),
      ]);
      if (claims.length === 0) return [];
      const channels = find(v, [
        words(
          "whats\\s?app", "telegram", "signal app", "personal (?:number|phone|mobile|whatsapp)",
          "my (?:number|mobile|phone|whatsapp)", "this number", "is number", "iss number",
          "call (?:me|us|karo|karein|kare|kijiye)", "व्हाट्सएप", "व्हाट्सऐप", "टेलीग्राम", "इस नंबर", "मेरे नंबर",
        ),
        /(?:wa|t)\.me\/\S+/giu,
        /(?:\+?91[\s-]?)?(?<!\d)[6-9]\d{4}[\s-]?\d{5}(?!\d)/gu,
      ]);
      return channels.length ? [...claims, ...channels] : [];
    },
  },
  {
    id: "threats",
    severity: "medium",
    weight: 3,
    explanation: {
      en: "It threatens you with arrest, deportation, a police case or a cancelled visa. Scammers use fear to rush you.",
      hi: "इसमें गिरफ्तारी, देश से निकालने, पुलिस केस या वीज़ा रद्द होने की धमकी है। धोखेबाज़ डर दिखाकर जल्दबाज़ी कराते हैं।",
    },
    match: (v) =>
      find(
        v,
        [
          words(
            "deport" + LETTERS, "arrest" + LETTERS, "jail", "prison", "police (?:case|complaint|action|station)",
            "legal action", "court case", "warrant", "blacklist" + LETTERS, "banned", "case (?:darj|file)" + LETTERS,
            `(?:${VISA}) (?:will be |would be |is being |has been |is |ho )?(?:cancel|revok|block|band|radd)` + LETTERS,
            "giraftar" + LETTERS, "गिरफ्तार" + LETTERS, "जेल", "पुलिस", "कानूनी कार्रवाई", "ब्लैकलिस्ट", "डिपोर्ट" + LETTERS,
            "(?:वीजा|वीसा) (?:रद्द|कैंसिल|ब्लॉक)",
          ),
        ],
        { skipNegated: true },
      ),
  },
  {
    id: "urgency",
    severity: "low",
    weight: 1,
    explanation: {
      en: "It pushes you to act right now (\"last chance\", \"today only\"). Real visa steps give you time.",
      hi: "इसमें तुरंत कुछ करने का दबाव है (\"आखिरी मौका\", \"सिर्फ़ आज\")। असली वीज़ा प्रक्रिया में समय मिलता है।",
    },
    match: (v) =>
      find(v, [
        words(
          "urgent" + LETTERS, "immediately", "right now", "asap", "today only", "only today", "last chance",
          "final (?:notice|warning|reminder|chance)", "within \\d+ (?:hours?|hrs?|minutes?|mins?)",
          "\\d+ (?:hours?|hrs?|ghante) (?:me|mein|में|ke andar)", "expires? (?:today|tonight|soon)",
          "before (?:midnight|tonight)", "abhi (?:call|pay|bhejo|bhejiye|karo|karein|send)", "turant", "fauran",
          "aaj hi", "jaldi (?:karo|karein|kijiye)", "warna", "varna", "nahi to", "nahin to", "otherwise (?:you|your)",
          "तुरंत", "फौरन", "आज ही", "आखिरी मौका", "अंतिम मौका", "अंतिम चेतावनी", "वरना", "नहीं तो",
          "अभी (?:भेज|कॉल|भुगतान|कर)" + LETTERS,
        ),
      ]),
  },
  {
    id: "asks-for-otp-or-bank",
    severity: "high",
    weight: 5,
    explanation: {
      en: "It asks for an OTP, PIN, password or bank details. Never share these with anyone, even someone who says they are an official.",
      hi: "इसमें OTP, PIN, पासवर्ड या बैंक की जानकारी माँगी गई है। ये किसी को न दें, चाहे वह खुद को अधिकारी बताए।",
    },
    match: (v) => {
      const secret = [
        "otp", "one[- ]time password", "pin", "atm pin", "upi pin", "cvv", "card (?:number|details)", "debit card",
        "credit card", "net ?banking" + LETTERS, "bank (?:details|account|a/c|login|password)", "account (?:number|no\\.?|details)",
        "ifsc", "password", "ओटीपी", "पिन", "बैंक (?:खाता|डिटेल|विवरण|अकाउंट)", "खाता (?:नंबर|संख्या)", "पासवर्ड", "कार्ड नंबर",
      ].join("|");
      return find(v, [near(secret, ASK_VERB, 30)], { skipNegated: true, negationInside: true });
    },
  },
  {
    id: "asks-for-documents",
    severity: "medium",
    weight: 3,
    explanation: {
      en: "It asks you to send your passport, passport photos or Aadhaar over chat. Only share these with family you know, or on the official .gov site.",
      hi: "इसमें चैट पर पासपोर्ट, पासपोर्ट फ़ोटो या आधार भेजने को कहा गया है। इन्हें सिर्फ़ जाने-पहचाने परिवार वालों को या आधिकारिक .gov साइट पर ही दें।",
    },
    match: (v) => {
      const doc = [
        "passport(?: (?:size )?(?:photos?|copy|scan|details|number|no\\.?|front|back|pages?))?", "aadhaa?r(?: card| number| copy)?",
        "pan card", "पासपोर्ट", "आधार", "पैन कार्ड",
      ].join("|");
      return find(v, [near(doc, ASK_VERB, 30)], { skipNegated: true, negationInside: true });
    },
  },
  {
    id: "non-gov-link",
    severity: "low",
    weight: 1,
    explanation: {
      en: "It has a link that is not a U.S. government website. U.S. government sites end in .gov. Do not type your details on other sites.",
      hi: "इसमें ऐसा लिंक है जो U.S. सरकार की वेबसाइट नहीं है। U.S. सरकारी साइटें .gov पर खत्म होती हैं। दूसरी साइटों पर अपनी जानकारी न डालें।",
    },
    match: (v) => findLinks(v).filter((l) => !l.host.endsWith(".gov")).map((l) => l.phrase),
  },
  {
    id: "short-link",
    severity: "medium",
    weight: 2,
    explanation: {
      en: "It has a shortened link (like bit.ly) that hides where it really goes.",
      hi: "इसमें छोटा किया हुआ लिंक (जैसे bit.ly) है, जो छिपा देता है कि वह असल में कहाँ ले जाता है।",
    },
    match: (v) =>
      findLinks(v)
        .filter((l) => SHORTENERS.some((s) => l.host === s || l.host.endsWith("." + s)))
        .map((l) => l.phrase),
  },
  {
    id: "grammar-and-pressure",
    severity: "medium",
    weight: 2,
    requires: ["threats", "urgency"],
    explanation: {
      en: "It has odd spelling or grammar and also pressures you. Official messages are carefully written.",
      hi: "इसमें अजीब वर्तनी या व्याकरण है और साथ में दबाव भी है। आधिकारिक संदेश ध्यान से लिखे जाते हैं।",
    },
    match: (v) => {
      const markers = find(v, [
        words(
          "do the needful", "kindly", "revert back", "sir/madam", "dear (?:customer|applicant|candidate|beneficiary|user|sir|madam)",
          "ur", "u r", "pls", "plz", "thru", "(?:is|are|was) been", "has been (?:approve|cancel|select|reject)",
          "you are select", "congratulation", "gaurantee" + LETTERS,
        ),
        /[!?]{2,}/gu,
      ]);
      const shouting = (v.text.match(/(?<![\p{L}\d])\p{Lu}{4,}(?![\p{L}\d])/gu) ?? []).filter(
        (w) => !ACRONYMS.has(w),
      );
      if (shouting.length >= 3) markers.push(...shouting.slice(0, 3));
      return markers.length >= 2 ? markers : [];
    },
  },
  {
    id: "job-or-lottery",
    severity: "high",
    weight: 5,
    explanation: {
      en: "It ties your visa to a job offer, lottery or prize. A visitor visa never comes with a job or a prize.",
      hi: "इसमें वीज़ा को नौकरी, लॉटरी या इनाम से जोड़ा गया है। आगंतुक वीज़ा के साथ कभी नौकरी या इनाम नहीं मिलता।",
    },
    match: (v) =>
      find(
        v,
        [
          words(
            "job offers?", "job opportunit" + LETTERS, "jobs? (?:available|guaranteed)", "guaranteed jobs?", "work permit",
            "hiring", "placement", "naukri (?:milegi|dilayenge|ka offer|lagwa" + LETTERS + ")", "lottery", "lucky draw",
            "jackpot", "prizes?", "inaam", "you (?:have |'ve )?won", "selected (?:for|in) (?:a |the )?(?:job|lottery|draw|prize)",
            "jeet (?:gaye|gayi|gaya)", "earn (?:\\$|rs\\.?|₹)\\s?\\d" + "[\\d,]*", "salary (?:of )?(?:\\$|rs\\.?|₹)\\s?\\d[\\d,]*",
          ),
          prefixes("नौकरी (?:मिलेगी|दिला|का ऑफर)", "लॉटरी", "लकी ड्रॉ", "इनाम", "आप जीत", "आपने जीत"),
        ],
        { skipNegated: true },
      ),
  },
];

// Capitalised words that are normal in visa messages, not shouting.
const ACRONYMS = new Set([
  "VISA", "USCIS", "OTP", "UPI", "AADHAAR", "AADHAR", "NEFT", "IMPS", "RTGS", "IFSC", "DELHI", "MUMBAI",
  "CHENNAI", "KOLKATA", "HYDERABAD", "INDIA", "USA", "EMBASSY", "PAYTM",
]);

export function getSignal(id: SignalId): Signal {
  const signal = SIGNALS.find((s) => s.id === id);
  if (!signal) throw new Error(`Unknown signal: ${id}`);
  return signal;
}
