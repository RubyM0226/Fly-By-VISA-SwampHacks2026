import type { Lang } from "@/lib/settings";

// FlyByVisa helper templates, built as Word files by app/api/templates/[id].
// These are ours, never an official form. Each file is in the person's site
// language plus English; a language with no text here falls back to English.
// Hindi and Spanish are first drafts: have a fluent reader check them.

export interface TemplateText {
  title: string;
  /** Short lines under the title: what this is and how to use it. */
  intro: string[];
  /** One label per question, in the same order as `lines`. */
  items: string[];
  closing: string;
}

export interface Template {
  /** Download name, without ".docx". */
  fileName: string;
  /** How many blank answer lines each item gets. */
  lines: number[];
  text: { en: TemplateText } & Partial<Record<Lang, TemplateText>>;
}

const TEMPLATES = {
  "trip-plan": {
    fileName: "FlyByVisa-trip-plan",
    lines: [1, 1, 1, 2, 1, 1, 1, 1, 2],
    text: {
      en: {
        title: "A simple trip plan",
        intro: [
          "This is a FlyByVisa helper template. It is NOT an official government form.",
          "Fill it in, print it, and keep it with your papers.",
        ],
        items: [
          "Your name",
          "Why you are going",
          "Who you will visit, and how you are related",
          "Address where you will stay in the U.S.",
          "Date you plan to arrive",
          "Date you plan to come home",
          "Places you plan to visit",
          "Who will pay for the trip",
          "Why you will come home (family, home, pension, work)",
        ],
        closing: "Answer honestly. Use your own words at the interview.",
      },
      hi: {
        title: "यात्रा की सरल योजना",
        intro: [
          "यह FlyByVisa का सहायक नमूना है। यह कोई आधिकारिक सरकारी फ़ॉर्म नहीं है।",
          "इसे भरें, प्रिंट करें, और अपने कागज़ों के साथ रखें।",
        ],
        items: [
          "आपका नाम",
          "आप क्यों जा रहे हैं",
          "आप किससे मिलेंगे, और उनसे रिश्ता",
          "U.S. में ठहरने की जगह का पता",
          "पहुँचने की योजना की तारीख",
          "घर लौटने की योजना की तारीख",
          "जिन जगहों पर जाने की योजना है",
          "यात्रा का खर्च कौन उठाएगा",
          "आप क्यों लौटेंगे (परिवार, घर, पेंशन, काम)",
        ],
        closing: "सच्चाई से लिखें। इंटरव्यू में अपने शब्दों में बोलें।",
      },
      es: {
        title: "Un plan de viaje sencillo",
        intro: [
          "Esta es una plantilla de ayuda de FlyByVisa. NO es un formulario oficial del gobierno.",
          "Llénela, imprímala y guárdela con sus papeles.",
        ],
        items: [
          "Su nombre",
          "Por qué viaja",
          "A quién visitará y qué parentesco tiene con esa persona",
          "Dirección donde se quedará en U.S.",
          "Fecha en que planea llegar",
          "Fecha en que planea volver a casa",
          "Lugares que planea visitar",
          "Quién pagará el viaje",
          "Por qué volverá a casa (familia, hogar, pensión, trabajo)",
        ],
        closing: "Responda con sinceridad. En la entrevista use sus propias palabras.",
      },
    },
  },
} satisfies Record<string, Template>;

export type TemplateId = keyof typeof TEMPLATES;
export const TEMPLATE_BY_ID: Record<TemplateId, Template> = TEMPLATES;

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && Object.hasOwn(TEMPLATES, value);
}
