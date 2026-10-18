import { LINKS } from "@/lib/config";
import { STEPS_BY_PURPOSE, type StepId } from "@/lib/journey";import { STEP_BY_ID } from "./steps";
import type { Lang } from "@/lib/settings";
import type { TemplateId } from "./templates";


// Every item in a roadmap step's "What you need" list. Steps in content/steps.ts
// list these ids, so the roadmap and the Documents tab share one source.
//
// `upload: true` items are papers a person can keep a copy of on the Documents
// tab. The rest (dates, details to know) only show on the roadmap.
//
// `blank` says how to get an empty version. Never invent an "official" form:
// "template" is a FlyByVisa Word file from content/templates.ts, labelled as ours.
// Names use [[term|Shown text]] glossary chips like steps.ts. Hindi is a first
// draft: have a fluent reader check it. Names use the home-country tokens and
// India's links from lib/homeCountry.ts; render through useHome().loc.

export type Blank =
  | { type: "online"; url: string }
  | { type: "none"; url?: string }
  | { type: "template"; id: TemplateId };

export interface DocumentEntry {
  name: Record<Lang, string>;
  /**
   * One line under the name on the Documents page: what it is and what is
   * expected. Left out where the name says it all (passport, photo, ticket).
   * FACT-CHECK: written from the State Department visitor visa pages; marked
   * VERIFY where we are less sure.
   */
  description?: Record<Lang, string>;
  upload: boolean;
  blank?: Blank;
}
const ALL_STEPS = [...new Set(Object.values(STEPS_BY_PURPOSE).flat())] as StepId[];
const ENTRIES = {
  passport: {
    name: { en: "Your passport", hi: "आपका पासपोर्ट" },
    upload: true,
    blank: { type: "none", url: LINKS.passportIndia },
  },
  travelDates: { name: { en: "Your travel dates", hi: "यात्रा की तारीखें" }, upload: false },
  travelFamilyDetails: {
    name: { en: "Travel and family details", hi: "यात्रा और परिवार की जानकारी" },
    upload: false,
  },
  photo: {
    name: { en: "A digital photo", hi: "डिजिटल फ़ोटो" },
    upload: true,
    blank: { type: "none", url: LINKS.photoRules },
  },
  ds160Confirmation: {
    name: { en: "[[ds160|DS-160]] confirmation page", hi: "[[ds160|DS-160]] पुष्टि पृष्ठ" },
    // VERIFY: the barcode page is what the interview asks for (travel.state.gov DS-160 FAQ).
    description: {
      en: "The page you get after you send the DS-160 form online. It has a barcode. Print it and bring it to your interview.",
      hi: "DS-160 फ़ॉर्म ऑनलाइन भेजने के बाद मिलने वाला पृष्ठ। इस पर बारकोड होता है। इसे प्रिंट करके इंटरव्यू में ले जाएँ।",
    },
    upload: true,
    blank: { type: "online", url: LINKS.ds160 },
  },
  feeReceipt: {
    name: { en: "Fee receipt", hi: "शुल्क की रसीद" },
    // VERIFY: the payment receipt / reference is needed to schedule in each home country.
    description: {
      en: "Proof that you paid the visa fee. You need it to book your appointments.",
      hi: "वीज़ा शुल्क भरने का प्रमाण। अपॉइंटमेंट बुक करने के लिए इसकी ज़रूरत होती है।",
    },
    upload: true,
    blank: { type: "none", url: LINKS.fees },
  },
  appointmentLetters: {
    name: { en: "Appointment letters", hi: "अपॉइंटमेंट पत्र" },
    description: {
      en: "The letters that confirm the date and time of each appointment. Bring them on the day.",
      hi: "हर अपॉइंटमेंट की तारीख और समय बताने वाले पत्र। उस दिन इन्हें साथ ले जाएँ।",
    },
    upload: true,
    blank: { type: "none", url: LINKS.embassyIndia },
  },
  lifeInIndia: {
    name: { en: "Proof of your life in {home}", hi: "{home} में आपके जीवन का प्रमाण" },
    // VERIFY: examples of home ties. Officers decide case by case; a family photo is weak evidence on its own.
    description: {
      en: "Papers that show your home, family and income are in {home}, so you will come back. For example: a job or pension letter, property papers, recent bank statements, or a family photo.",
      hi: "ऐसे कागज़ जो दिखाएँ कि आपका घर, परिवार और आमदनी {home} में है, इसलिए आप लौटेंगे। जैसे: नौकरी या पेंशन का पत्र, संपत्ति के कागज़, हाल के बैंक स्टेटमेंट, या परिवार की फ़ोटो।",
    },
    upload: true,
    blank: { type: "none" },
  },
  fundsProof: {
    name: { en: "Proof of how you will pay", hi: "खर्च कैसे उठाएँगे, इसका प्रमाण" },
    // VERIFY: a support letter from the paying relative is common, not an official requirement.
    description: {
      en: "Papers that show how the trip is paid for. For example: recent bank statements, a pension letter, or a letter from the family member who is paying.",
      hi: "ऐसे कागज़ जो दिखाएँ कि यात्रा का खर्च कैसे उठेगा। जैसे: हाल के बैंक स्टेटमेंट, पेंशन का पत्र, या खर्च उठाने वाले परिवार के सदस्य का पत्र।",
    },
    upload: true,
    blank: { type: "none" },
  },
  tripPlan: {
    name: { en: "A simple trip plan", hi: "यात्रा की सरल योजना" },
    description: {
      en: "A short plan of where you will stay, who you will visit and when you will come back.",
      hi: "आप कहाँ ठहरेंगे, किससे मिलेंगे और कब लौटेंगे, इसकी छोटी योजना।",
    },
    upload: true,
    blank: { type: "template", id: "trip-plan" },
  },
  lastStepPapers: {
    name: { en: "Your papers from the last step", hi: "पिछले कदम के कागज़ात" },
    upload: false,
  },
  passportWithVisa: {
    name: { en: "Passport with the visa", hi: "वीज़ा वाला पासपोर्ट" },
    description: {
      en: "Your passport with the visa inside. Check that the name and dates on the visa are right.",
      hi: "अंदर लगे वीज़ा वाला आपका पासपोर्ट। देखें कि वीज़ा पर नाम और तारीखें सही हैं।",
    },
    upload: true,
    blank: { type: "none" },
  },
  flightDetails: {
    name: { en: "Flight details", hi: "उड़ान की जानकारी" },
    description: {
      en: "Your ticket or booking confirmation, with the flight numbers and times.",
      hi: "आपका टिकट या बुकिंग की पुष्टि, उड़ान नंबर और समय के साथ।",
    },
    upload: true,
    blank: { type: "none" },
  },
  insurance: {
    name: { en: "Insurance papers, if you buy it", hi: "बीमा के कागज़, अगर लें" },
    // VERIFY: insurance is not required for a B-2 visa.
    description: {
      en: "Travel health insurance is not required for the visa, but U.S. hospital care is very expensive. If you buy it, keep the policy papers here.",
      hi: "वीज़ा के लिए यात्रा स्वास्थ्य बीमा ज़रूरी नहीं है, पर U.S. में अस्पताल का इलाज बहुत महंगा है। अगर आप लें, तो पॉलिसी के कागज़ यहाँ रखें।",
    },
    upload: true,
    blank: { type: "none" },
  },
  stayAddress: { name: { en: "Address where you will stay", hi: "ठहरने की जगह का पता" }, upload: false },
  tripDetails: { name: { en: "Your trip details", hi: "आपकी यात्रा की जानकारी" }, upload: false },
  i94: {
    name: { en: "Your [[i94|I-94]] record", hi: "आपका [[i94|I-94]] रिकॉर्ड" },
    // VERIFY: I-94 is electronic for air arrivals and downloadable from i94.cbp.dhs.gov.
    description: {
      en: "Your arrival record. It is made online when you enter the U.S. You can download it from the official website a few days later.",
      hi: "आपके पहुँचने का रिकॉर्ड। यह U.S. में प्रवेश करते समय ऑनलाइन बनता है। कुछ दिन बाद आप इसे आधिकारिक वेबसाइट से डाउनलोड कर सकते हैं।",
    },
    upload: true,
    blank: { type: "online", url: LINKS.i94 },
  },
  returnTicket: {
    name: { en: "Your return ticket", hi: "वापसी का टिकट" },
    upload: true,
    blank: { type: "none" },
  },
} satisfies Record<string, DocumentEntry>;

export type DocId = keyof typeof ENTRIES;
export const DOCUMENTS: Record<DocId, DocumentEntry> = ENTRIES;

/** A catalog id that a file can be tied to (an uploadable document). */
export function isUploadDocId(value: unknown): value is DocId {
  return (
    typeof value === "string" &&
    Object.hasOwn(DOCUMENTS, value) && DOCUMENTS[value as DocId].upload
  );
}

/** Roadmap steps that need at least one uploadable document, in roadmap order. */
export const DOC_GROUPS: { stepId: StepId; docs: DocId[] }[] = ALL_STEPS.map((stepId) => ({
  stepId,
  // Use optional chaining to safely check if the step and its documents array exist
  docs: STEP_BY_ID[stepId]?.documents?.filter((id) => DOCUMENTS[id].upload) || [],
})).filter((g) => g.docs.length > 0);

/** Every uploadable document the roadmap asks for, once each. */
export const UPLOAD_DOC_IDS: DocId[] = [...new Set(DOC_GROUPS.flatMap((g) => g.docs))];
