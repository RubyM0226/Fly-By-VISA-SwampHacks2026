import { LINKS } from "@/lib/config";
import type { Lang } from "@/lib/settings";

// Common document questions for the India -> U.S. visitor (B-2) visa, for the
// Information Lookup page. Keep answers short and plain: an elderly reader
// in India, need-to-know only. Facts match content/steps.ts; every answer
// links to an official page. Hindi is a first draft: have a fluent reader
// check it. Use [[term|Shown text]] for glossary chips.

export interface DocAnswer {
  id: string;
  /** Words people might type, in English and Hindi. Matched loosely. */
  keywords: string[];
  question: Record<Lang, string>;
  answer: Record<Lang, string>;
  source: { label: Record<Lang, string>; url: string };
}

export const DOC_FAQ: DocAnswer[] = [
  {
    id: "passport",
    keywords: ["passport", "valid", "validity", "expiry", "expire", "पासपोर्ट", "मान्य", "pasaporte", "vigencia", "vigente", "vence", "caduca", "validez"],
    question: { en: "What do I need to know about my passport?", hi: "मेरे पासपोर्ट के बारे में क्या जानना ज़रूरी है?", es: "¿Qué necesito saber sobre mi pasaporte?" },
    answer: {
      en: "Your passport must still be valid 6 months after the day you plan to come home. Check the date on it before you start. You will need it for every step.",
      hi: "लौटने की तारीख के 6 महीने बाद तक आपका पासपोर्ट मान्य होना चाहिए। शुरू करने से पहले उस पर तारीख देख लें। हर कदम पर इसकी ज़रूरत होगी।",
      es: "Su pasaporte debe seguir vigente 6 meses después del día en que planea regresar a casa. Revise la fecha antes de empezar. Lo necesitará en cada paso.",
    },
    source: { label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" }, url: LINKS.visitorVisa },
  },
  {
    id: "ds160",
    keywords: ["ds160", "ds 160", "form", "online form", "application", "confirmation", "barcode", "फ़ॉर्म", "फॉर्म", "पुष्टि", "बारकोड", "formulario", "solicitud", "confirmacion", "codigo de barras", "en linea"],
    question: { en: "What is the DS-160 confirmation page?", hi: "DS-160 पुष्टि पृष्ठ क्या है?", es: "¿Qué es la página de confirmación del DS-160?" },
    answer: {
      en: "The [[ds160|DS-160]] is the online visa form. When you finish it, a page with a barcode appears. Print that page and take it to your interview.",
      hi: "[[ds160|DS-160]] ऑनलाइन वीज़ा फ़ॉर्म है। इसे पूरा करने पर बारकोड वाला एक पृष्ठ आता है। उसे प्रिंट करें और इंटरव्यू में ले जाएँ।",
      es: "El [[ds160|DS-160]] es el formulario de visa en línea. Al terminarlo, aparece una página con un código de barras. Imprima esa página y llévela a su entrevista.",
    },
    source: { label: { en: "Official DS-160 form", hi: "आधिकारिक DS-160 फ़ॉर्म", es: "Formulario oficial DS-160" }, url: LINKS.ds160 },
  },
  {
    id: "photo",
    keywords: ["photo", "photograph", "picture", "passport photo", "image", "फ़ोटो", "फोटो", "तस्वीर", "foto", "fotografia", "imagen", "foto del pasaporte"],
    question: { en: "What photo do I need?", hi: "मुझे कैसी फ़ोटो चाहिए?", es: "¿Qué foto necesito?" },
    answer: {
      en: "You upload a digital photo with the DS-160 form. It must follow the official photo rules. Read them before you take the photo.",
      hi: "DS-160 फ़ॉर्म के साथ एक डिजिटल फ़ोटो अपलोड करनी होती है। वह आधिकारिक नियमों के अनुसार होनी चाहिए। फ़ोटो खिंचवाने से पहले नियम पढ़ लें।",
      es: "Usted sube una foto digital junto con el formulario DS-160. Debe cumplir las reglas oficiales de fotos. Léalas antes de tomar la foto.",
    },
    source: { label: { en: "Official photo rules", hi: "फ़ोटो के आधिकारिक नियम", es: "Reglas oficiales de la foto" }, url: LINKS.photoRules },
  },
  {
    id: "fee",
    keywords: ["fee", "fees", "receipt", "payment", "pay", "cost", "money", "185", "शुल्क", "रसीद", "भुगतान", "फीस", "tarifa", "tarifas", "recibo", "pago", "pagar", "costo", "dinero"],
    question: { en: "What is the visa fee receipt?", hi: "वीज़ा शुल्क की रसीद क्या है?", es: "¿Qué es el recibo de pago de la visa?" },
    answer: {
      en: "The visa application fee is $185. Other fees may apply. After you pay, keep the receipt. You need it to book your interview.",
      hi: "वीज़ा आवेदन शुल्क $185 है। दूसरे शुल्क भी लग सकते हैं। भुगतान के बाद रसीद संभालकर रखें। इंटरव्यू बुक करने के लिए इसकी ज़रूरत होगी।",
      es: "La tarifa de solicitud de la visa es de $185. Pueden aplicarse otras tarifas. Después de pagar, guarde el recibo. Lo necesita para reservar su entrevista.",
    },
    source: { label: { en: "Official fee page", hi: "आधिकारिक शुल्क पृष्ठ", es: "Página oficial de tarifas" }, url: LINKS.fees },
  },
  {
    id: "appointment",
    keywords: ["appointment", "appointment letter", "interview letter", "booking", "book", "interview", "अपॉइंटमेंट", "इंटरव्यू", "पत्र", "बुकिंग", "cita", "citas", "carta de la cita", "reservar", "reserva", "entrevista"],
    question: { en: "What is the appointment letter?", hi: "अपॉइंटमेंट पत्र क्या है?", es: "¿Qué es la carta de la cita?" },
    answer: {
      en: "When you book your interview, you get a confirmation. Print it and bring it on the day. Booking steps can change, so follow the U.S. Embassy website.",
      hi: "इंटरव्यू बुक करने पर एक पुष्टि मिलती है। उसे प्रिंट करें और उस दिन साथ ले जाएँ। बुकिंग के तरीके बदल सकते हैं, इसलिए अमेरिकी दूतावास की वेबसाइट देखें।",
      es: "Al reservar su entrevista, recibe una confirmación. Imprímala y llévela ese día. Los pasos para reservar pueden cambiar, así que siga el sitio web de la Embajada de EE. UU.",
    },
    source: { label: { en: "U.S. Embassy in India: visas", hi: "भारत में अमेरिकी दूतावास: वीज़ा", es: "Embajada de EE. UU. en India: visas" }, url: LINKS.embassyIndia },
  },
  {
    id: "vac",
    keywords: ["vac", "fingerprint", "fingerprints", "biometric", "biometrics", "visa application center", "उंगलियों", "निशान", "huellas", "huellas digitales", "biometria", "centro de solicitud"],
    question: { en: "What is the VAC visit?", hi: "VAC जाना क्या होता है?", es: "¿Qué es la visita al VAC?" },
    answer: {
      en: "Many people in India first visit a [[vac|VAC]], where your fingerprints and photo are taken. Then you go to your interview. Bring your passport and appointment letter.",
      hi: "भारत में कई लोग पहले [[vac|VAC]] जाते हैं, जहाँ उंगलियों के निशान और फ़ोटो लिए जाते हैं। फिर इंटरव्यू होता है। पासपोर्ट और अपॉइंटमेंट पत्र साथ ले जाएँ।",
      es: "Muchas personas en India primero visitan un [[vac|VAC]], donde les toman las huellas digitales y la foto. Después van a su entrevista. Lleve su pasaporte y la carta de la cita.",
    },
    source: { label: { en: "U.S. Embassy in India: visas", hi: "भारत में अमेरिकी दूतावास: वीज़ा", es: "Embajada de EE. UU. en India: visas" }, url: LINKS.embassyIndia },
  },
  {
    id: "supporting",
    keywords: ["supporting", "documents", "papers", "proof", "ties", "home", "pension", "family", "property", "job", "कागज़", "कागज", "प्रमाण", "पेंशन", "घर", "परिवार", "papeles", "documentos", "pruebas", "apoyo", "vivienda", "pension", "familia", "propiedad", "trabajo"],
    question: { en: "Which supporting papers should I bring?", hi: "मुझे कौन-से सहायक कागज़ात ले जाने चाहिए?", es: "¿Qué papeles de apoyo debo llevar?" },
    answer: {
      en: "Bring papers that show your life is in India and that you will come home. For example: family, a home, a pension or work. The officer may ask to see them.",
      hi: "ऐसे कागज़ात ले जाएँ जो दिखाएँ कि आपका जीवन भारत में है और आप लौटेंगे। जैसे: परिवार, घर, पेंशन या काम। अधिकारी इन्हें देखना चाह सकते हैं।",
      es: "Lleve papeles que muestren que su vida está en India y que va a regresar a casa. Por ejemplo: familia, una vivienda, una pensión o un trabajo. El oficial puede pedir verlos.",
    },
    source: { label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" }, url: LINKS.visitorVisa },
  },
  {
    id: "funds",
    keywords: ["money", "funds", "bank", "statement", "pay for", "sponsor", "expenses", "खर्च", "बैंक", "पैसे", "fondos", "banco", "extracto", "patrocinador", "gastos", "dinero"],
    question: { en: "Do I need to show how the trip is paid for?", hi: "क्या दिखाना होगा कि यात्रा का खर्च कैसे उठाया जाएगा?", es: "¿Debo mostrar cómo se paga el viaje?" },
    answer: {
      en: "Yes. Be ready to show how the trip will be paid for. Bring papers that prove it.",
      hi: "हाँ। दिखाने के लिए तैयार रहें कि यात्रा का खर्च कैसे उठाया जाएगा। इसके प्रमाण वाले कागज़ात साथ ले जाएँ।",
      es: "Sí. Esté listo para mostrar cómo se pagará el viaje. Lleve papeles que lo demuestren.",
    },
    source: { label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" }, url: LINKS.visitorVisa },
  },
  {
    id: "invitation",
    keywords: ["invitation", "invite", "letter", "son", "daughter", "children", "relative", "निमंत्रण", "बेटा", "बेटी", "invitacion", "carta de invitacion", "hijo", "hija", "hijos", "familiar"],
    question: { en: "Do I need an invitation letter from my family?", hi: "क्या परिवार का निमंत्रण पत्र ज़रूरी है?", es: "¿Necesito una carta de invitación de mi familia?" },
    answer: {
      en: "No. A letter from family in the U.S. is not required. The officer decides by looking at your own life and plans.",
      hi: "नहीं। अमेरिका में परिवार का पत्र ज़रूरी नहीं है। अधिकारी आपके अपने जीवन और योजनाओं को देखकर फ़ैसला करते हैं।",
      es: "No. No se exige una carta de familiares en EE. UU. El oficial decide según su propia vida y sus planes.",
    },
    source: { label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" }, url: LINKS.visitorVisa },
  },
  {
    id: "i94",
    keywords: ["i94", "i 94", "arrival record", "leave date", "how long", "stay", "airport", "आगमन", "रिकॉर्ड", "llegada", "registro", "fecha de salida", "cuanto tiempo", "quedarme", "aeropuerto"],
    question: { en: "What is the I-94?", hi: "I-94 क्या है?", es: "¿Qué es el I-94?" },
    answer: {
      en: "The [[i94|I-94]] is your arrival record. The officer at the U.S. airport decides how long you can stay. The I-94 shows the date you must leave.",
      hi: "[[i94|I-94]] आपका आगमन रिकॉर्ड है। अमेरिकी हवाई अड्डे पर अधिकारी तय करते हैं कि आप कितने समय रुक सकते हैं। I-94 में लौटने की तारीख होती है।",
      es: "El [[i94|I-94]] es su registro de llegada. El oficial del aeropuerto de EE. UU. decide cuánto tiempo puede quedarse. El I-94 muestra la fecha en que debe salir.",
    },
    source: { label: { en: "Look up your I-94", hi: "अपना I-94 देखें", es: "Consulte su I-94" }, url: LINKS.i94 },
  },
  {
    id: "extend",
    keywords: ["extend", "extension", "stay longer", "longer", "uscis", "overstay", "बढ़ाना", "ज़्यादा रुकना", "extender", "extension", "quedarme mas", "mas tiempo", "prorroga"],
    question: { en: "What if I want to stay longer?", hi: "अगर मैं ज़्यादा रुकना चाहूँ तो?", es: "¿Y si quiero quedarme más tiempo?" },
    answer: {
      en: "Read the rules before your leave date passes. Asking to stay longer may cost a fee. Staying too long can cancel your visa.",
      hi: "लौटने की तारीख निकलने से पहले नियम पढ़ें। ज़्यादा रुकने के आवेदन पर शुल्क लग सकता है। ज़्यादा रुकने से वीज़ा रद्द हो सकता है।",
      es: "Lea las reglas antes de que pase su fecha de salida. Pedir más tiempo puede costar una tarifa. Quedarse demasiado puede cancelar su visa.",
    },
    source: { label: { en: "USCIS: extend your stay", hi: "USCIS: ठहराव बढ़ाना", es: "USCIS: extender su estadía" }, url: LINKS.uscisExtend },
  },
  {
    id: "agents",
    keywords: ["agent", "agents", "fraud", "scam", "guarantee", "help", "एजेंट", "धोखा", "धोखाधड़ी", "agente", "agentes", "fraude", "estafa", "garantia", "garantizar", "ayuda"],
    question: { en: "Should I pay an agent?", hi: "क्या मुझे किसी एजेंट को पैसे देने चाहिए?", es: "¿Debo pagarle a un agente?" },
    answer: {
      en: "Pay visa fees only through official channels. Be careful of anyone who promises a visa. Nobody can guarantee one.",
      hi: "वीज़ा शुल्क केवल आधिकारिक माध्यम से भरें। वीज़ा का वादा करने वालों से सावधान रहें। कोई भी वीज़ा की गारंटी नहीं दे सकता।",
      es: "Pague las tarifas de la visa solo por canales oficiales. Tenga cuidado con quien prometa una visa. Nadie puede garantizarla.",
    },
    source: { label: { en: "Official fraud warning", hi: "आधिकारिक धोखाधड़ी चेतावनी", es: "Advertencia oficial sobre fraudes" }, url: LINKS.fraudWarning },
  },
];

/** Lower-case, drop punctuation and dashes, so "DS-160" and "ds160" match. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    // Drop Latin accents so "informacion" finds "información". Devanagari
    // vowel signs are a different Unicode block and stay.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, "$1")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}
const squash = (text: string) => normalize(text).replace(/\s+/g, "");

// Words that say nothing about which document is meant.
const FILLER = new Set([
  "what", "is", "the", "a", "an", "do", "does", "i", "my", "me", "for", "to", "of", "need", "how",
  "about", "should", "can", "it", "in", "and", "or", "are",
  "क्या", "है", "हैं", "का", "की", "के", "मुझे", "मेरे", "मेरा", "को", "में", "और",
  "que", "es", "el", "la", "los", "las", "un", "una", "de", "del", "mi", "mis", "para", "como", "necesito",
  "debo", "puedo", "por", "con", "en", "y", "o", "si",
]);

/** Best matches first. Looks at keywords and question text in every language. */
export function searchDocs(query: string): DocAnswer[] {
  const words = normalize(query)
    .split(" ")
    .filter((w) => w.length >= 2 && !FILLER.has(w));
  if (words.length === 0) return [];
  const whole = squash(query);
  const scored = DOC_FAQ.map((d) => {
    const keys = d.keywords.map(squash);
    const text = normalize(`${d.question.en} ${d.question.hi} ${d.question.es}`);
    let score = 0;
    // The whole query is a keyword ("passport photo", "ds 160").
    if (keys.includes(whole)) score += 6;
    for (const w of words) {
      if (keys.includes(w)) score += 3;
      else if (keys.some((k) => k.startsWith(w) || (w.length >= 4 && k.includes(w)))) score += 2;
      if (text.split(" ").includes(w)) score += 1;
    }
    return { d, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.d);
}
