import { format, useT, type Vars } from "../i18n";
import type { Lang } from "../settings";

// UI strings for Scam Check. Kept out of lib/i18n.ts to avoid merge
// conflicts. Write English first, then Hindi.
//
// NOTE FOR TEAM: all Hindi below is a DRAFT and needs a native Hindi reader
// before the demo.

const en = {
  title: "Scam Check",
  intro: "Got a message about your visa? Paste it here, or add a screenshot of it, and we will look for signs of a scam. This page only checks for scams.",
  inputLabel: "Message to check",
  placeholder: "Paste the message here",
  imageLabel: "Or add a screenshot (optional)",
  imageHint: "PNG, JPG or WEBP, under 4 MB.",
  imageChoose: "Choose a screenshot",
  imageRemove: "Remove screenshot",
  imageBad: "Please choose a PNG, JPG or WEBP picture.",
  imageBig: "That picture is too big. Please choose one under 4 MB.",
  imageOff: "Checking screenshots is not available right now. Please paste the text of the message instead.",
  imageFailed: "We could not read that screenshot. Please try again, or paste the text instead.",
  imageNoText: "We could not find any words in that screenshot. Please try another one, or paste the text.",
  imageLimit: "Many checks in a short time. Please try again in a minute.",
  question: "This looks like a question, not a message to check. For questions about visa forms and documents, please use Information Lookup.",
  questionLink: "Go to Information Lookup",
  check: "Check this message",
  example: "Try an example",
  checking: "Checking…",
  privacy:
    "We do not save what you type or any screenshot. To check text, we try to remove phone numbers, emails, ID numbers and names, then we may send the rest to Google's Gemini AI. A screenshot is sent as it is to Google's Gemini AI so it can read the words in it. We cannot hide details inside a picture first. It is not saved.",
  empty: "Please paste a message or add a screenshot first.",
  tooLong: "This is too long. Please paste up to {max} characters.",
  count: "{n} of {max} characters",
  error: "Something went wrong. Please try again.",
  why: "Why we think so",
  whyNone: "We did not find any of the warning signs we know about. That does not mean the message is real.",
  words: "Words we noticed:",
  todo: "What to do now",
  official: "Official pages",
  aiExplains: "Explained by AI. It can make mistakes, so check the official pages.",
  "note.ai-off": "Checked with our fixed rules only. The AI helper is not set up right now.",
  "note.ai-failed": "Checked with our fixed rules only. The AI helper could not answer right now.",
  "note.rate-limited": "Many checks in a short time, so this was checked with our fixed rules only. Try again in a minute.",
  "note.offline": "We could not reach our server, so this was checked on your device with our fixed rules only.",
  followLabel: "Ask a follow-up question",
  followAsk: "Ask",
  followLeft: "You can ask {n} more.",
  followDone: "That is the limit of follow-up questions. Press Start over to check something new.",
  followNeedsAi: "Follow-up questions need the AI helper, which is not available right now.",
  you: "You asked",
  answer: "Answer",
  startOver: "Start over",
  cleared: "Cleared. Nothing was saved.",
  announce: "Result: {verdict}",
  announceQuestion: "Answer ready.",
} as const;

export type ScamKey = keyof typeof en;

const hi: Record<ScamKey, string> = {
  title: "धोखा जाँच",
  intro: "वीज़ा के बारे में कोई संदेश आया है? उसे यहाँ चिपकाएँ, या उसका स्क्रीनशॉट जोड़ें, हम धोखे के संकेत देखेंगे। यह पृष्ठ सिर्फ़ धोखे की जाँच करता है।",
  inputLabel: "जाँचने के लिए संदेश",
  placeholder: "संदेश यहाँ चिपकाएँ",
  imageLabel: "या स्क्रीनशॉट जोड़ें (ज़रूरी नहीं)",
  imageHint: "PNG, JPG या WEBP, 4 MB से छोटा।",
  imageChoose: "स्क्रीनशॉट चुनें",
  imageRemove: "स्क्रीनशॉट हटाएँ",
  imageBad: "कृपया PNG, JPG या WEBP तस्वीर चुनें।",
  imageBig: "यह तस्वीर बहुत बड़ी है। कृपया 4 MB से छोटी तस्वीर चुनें।",
  imageOff: "स्क्रीनशॉट की जाँच अभी उपलब्ध नहीं है। कृपया संदेश का लिखा हुआ हिस्सा चिपकाएँ।",
  imageFailed: "हम यह स्क्रीनशॉट पढ़ नहीं पाए। कृपया फिर कोशिश करें, या लिखा हुआ हिस्सा चिपकाएँ।",
  imageNoText: "इस स्क्रीनशॉट में हमें कोई शब्द नहीं मिला। कृपया दूसरा चुनें, या लिखा हुआ हिस्सा चिपकाएँ।",
  imageLimit: "कम समय में बहुत सारी जाँचें हुईं। कृपया एक मिनट बाद फिर कोशिश करें।",
  question: "यह जाँचने वाला संदेश नहीं, एक सवाल लगता है। वीज़ा फ़ॉर्म और कागज़ात के सवालों के लिए कृपया \"जानकारी खोजें\" का उपयोग करें।",
  questionLink: "जानकारी खोजें पर जाएँ",
  check: "यह संदेश जाँचें",
  example: "एक उदाहरण देखें",
  checking: "जाँच हो रही है…",
  privacy:
    "आप जो लिखते हैं या जो स्क्रीनशॉट देते हैं, हम उसे सहेजते नहीं। लिखे हुए संदेश की जाँच के लिए हम फ़ोन नंबर, ईमेल, पहचान नंबर और नाम हटाने की कोशिश करते हैं, फिर बाकी हिस्सा Google के Gemini AI को भेज सकते हैं। स्क्रीनशॉट जैसा है वैसा ही Google के Gemini AI को भेजा जाता है ताकि वह उसके शब्द पढ़ सके। तस्वीर के अंदर की जानकारी हम पहले नहीं छिपा सकते। उसे सहेजा नहीं जाता।",
  empty: "पहले कोई संदेश चिपकाएँ या स्क्रीनशॉट जोड़ें।",
  tooLong: "यह बहुत लंबा है। ज़्यादा से ज़्यादा {max} अक्षर चिपकाएँ।",
  count: "{max} में से {n} अक्षर",
  error: "कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।",
  why: "हमें ऐसा क्यों लगता है",
  whyNone: "हमें कोई जाना-पहचाना चेतावनी संकेत नहीं मिला। इसका मतलब यह नहीं कि संदेश असली है।",
  words: "हमने ये शब्द देखे:",
  todo: "अब क्या करें",
  official: "आधिकारिक पृष्ठ",
  aiExplains: "AI ने समझाया है। इससे गलती हो सकती है, इसलिए आधिकारिक पृष्ठ ज़रूर देखें।",
  "note.ai-off": "सिर्फ़ हमारे तय नियमों से जाँचा गया। AI सहायक अभी चालू नहीं है।",
  "note.ai-failed": "सिर्फ़ हमारे तय नियमों से जाँचा गया। AI सहायक अभी जवाब नहीं दे पाया।",
  "note.rate-limited": "कम समय में बहुत सारी जाँचें हुईं, इसलिए सिर्फ़ तय नियमों से जाँचा गया। एक मिनट बाद फिर कोशिश करें।",
  "note.offline": "हमारे सर्वर से जुड़ नहीं पाए, इसलिए आपके डिवाइस पर ही तय नियमों से जाँचा गया।",
  followLabel: "आगे का सवाल पूछें",
  followAsk: "पूछें",
  followLeft: "आप {n} और सवाल पूछ सकते हैं।",
  followDone: "आगे के सवालों की सीमा पूरी हो गई। कुछ नया जाँचने के लिए फिर से शुरू करें दबाएँ।",
  followNeedsAi: "आगे के सवालों के लिए AI सहायक चाहिए, जो अभी उपलब्ध नहीं है।",
  you: "आपने पूछा",
  answer: "जवाब",
  startOver: "फिर से शुरू करें",
  cleared: "सब मिटा दिया गया। कुछ भी सहेजा नहीं गया।",
  announce: "नतीजा: {verdict}",
  announceQuestion: "जवाब तैयार है।",
};

const STRINGS: Record<Lang, Record<ScamKey, string>> = { en, hi };

/** Like useT(), for Scam Check's own strings. */
export function useScamT() {
  const { lang } = useT();
  const st = (key: ScamKey, vars?: Vars) => format(STRINGS[lang][key], vars);
  return { st, lang };
}

/** Made-up scam messages for "Try an example". Numbers and handles are fake. */
export const EXAMPLES: Record<Lang, string[]> = {
  en: [
    "This is Officer Daniel Brooks from the US Embassy New Delhi. There is a problem with your visa file. To avoid cancellation, pay Rs 25,000 today with Google Play gift cards and WhatsApp the codes to my personal number +91 98110 45672.",
    "URGENT!! Dear Customer ur US visa appointment will be CANCELLED TODAY. We can give you an early interview slot for Rs 15,000. Kindly verify immediately at bit.ly/usvisa-verify24",
  ],
  hi: [
    "नमस्ते, मैं अमेरिकी दूतावास से बोल रहा हूँ। आपके वीज़ा आवेदन में समस्या है। तुरंत इस नंबर पर व्हाट्सएप करें 9876501234 और अपना ओटीपी बताएं, वरना वीज़ा रद्द हो जाएगा।",
    "Namaste aunty ji, aapka US visa pakka milega, 100% guarantee. Bas 30 hazaar GPay kar do 98290 11223 pe, aaj hi.",
  ],
};
