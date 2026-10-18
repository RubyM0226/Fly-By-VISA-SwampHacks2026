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
// draft: have a fluent reader check it.

export type Blank =
  | { type: "online"; url: string }
  | { type: "none"; url?: string }
  | { type: "template"; id: TemplateId };

export interface DocumentEntry {
  name: Record<Lang, string>;
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
    upload: true,
    blank: { type: "online", url: LINKS.ds160 },
  },
  feeReceipt: {
    name: { en: "Fee receipt", hi: "शुल्क की रसीद" },
    upload: true,
    blank: { type: "none", url: LINKS.fees },
  },
  appointmentLetters: {
    name: { en: "Appointment letters", hi: "अपॉइंटमेंट पत्र" },
    upload: true,
    blank: { type: "none", url: LINKS.embassyIndia },
  },
  lifeInIndia: {
    name: { en: "Proof of your life in India", hi: "भारत में आपके जीवन का प्रमाण" },
    upload: true,
    blank: { type: "none" },
  },
  fundsProof: {
    name: { en: "Proof of how you will pay", hi: "खर्च कैसे उठाएँगे, इसका प्रमाण" },
    upload: true,
    blank: { type: "none" },
  },
  tripPlan: {
    name: { en: "A simple trip plan", hi: "यात्रा की सरल योजना" },
    upload: true,
    blank: { type: "template", id: "trip-plan" },
  },
  lastStepPapers: {
    name: { en: "Your papers from the last step", hi: "पिछले कदम के कागज़ात" },
    upload: false,
  },
  passportWithVisa: {
    name: { en: "Passport with the visa", hi: "वीज़ा वाला पासपोर्ट" },
    upload: true,
    blank: { type: "none" },
  },
  flightDetails: {
    name: { en: "Flight details", hi: "उड़ान की जानकारी" },
    upload: true,
    blank: { type: "none" },
  },
  insurance: {
    name: { en: "Insurance papers, if you buy it", hi: "बीमा के कागज़, अगर लें" },
    upload: true,
    blank: { type: "none" },
  },
  stayAddress: { name: { en: "Address where you will stay", hi: "ठहरने की जगह का पता" }, upload: false },
  tripDetails: { name: { en: "Your trip details", hi: "आपकी यात्रा की जानकारी" }, upload: false },
  i94: {
    name: { en: "Your [[i94|I-94]] record", hi: "आपका [[i94|I-94]] रिकॉर्ड" },
    upload: true,
    blank: { type: "online", url: LINKS.i94 },
  },i20Form: {
    name: { en: "Form I-20 (Signed)", hi: "फॉर्म I-20 (हस्ताक्षरित)" },
    upload: true,
    blank: { type: "none" },
  },
  sevisReceipt: {
    name: { en: "SEVIS I-901 Fee Receipt", hi: "SEVIS I-901 शुल्क रसीद" },
    upload: true,
    blank: { type: "online", url: "https://www.fmjfee.com/i901fee/index.html" },
  },
  i797Notice: {
    name: { en: "I-797 Approval Notice", hi: "I-797 स्वीकृति नोटिस" },
    upload: true,
    blank: { type: "none" },
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
