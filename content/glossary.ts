import type { Lang } from "@/lib/settings";

// Words people will not know. Used by [[key|Shown text]] markup in the step
// text, and listed on the Glossary page (keys are also the page anchors, e.g.
// /glossary#i94). Keys must be lower-case letters and digits only.
//
// Facts come from content/steps.ts, content/documentsFaq.ts and /corpus. Keep
// definitions short and plain, English first, then Hindi. Hindi is a first
// draft: have a fluent reader check it.

/** Display order on the Glossary page. Labels are in lib/i18n.ts. */
export const GLOSSARY_CATEGORIES = ["visas", "forms", "agencies", "process"] as const;
export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryEntry {
  /** The word as shown, e.g. "I-94". */
  term: Record<Lang, string>;
  definition: Record<Lang, string>;
  category: GlossaryCategory;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Visas
  b2: {
    term: { en: "B-2 Visa", hi: "B-2 वीज़ा", es: "Visa B-2" },
    definition: {
      en: "The visitor visa for tourism and visiting family.",
      hi: "पर्यटन और परिवार से मिलने के लिए आगंतुक वीज़ा।",
      es: "La visa de visitante para turismo y para visitar a la familia.",
    },
    category: "visas",
  },
  b1: {
    term: { en: "B-1 Visa", hi: "B-1 वीज़ा", es: "Visa B-1" },
    definition: {
      en: "The visitor visa for short business trips, like a meeting or a conference.",
      hi: "छोटी व्यापारिक यात्राओं के लिए आगंतुक वीज़ा, जैसे कोई मीटिंग या सम्मेलन।",
      es: "La visa de visitante para viajes de negocios cortos, como una reunión o una conferencia.",
    },
    category: "visas",
  },
  nonimmigrant: {
    term: { en: "Nonimmigrant visa", hi: "गैर-आप्रवासी वीज़ा", es: "Visa de no inmigrante" },
    definition: {
      en: "A visa for a short, temporary stay. The B-2 visitor visa is one.",
      hi: "थोड़े समय के ठहराव के लिए वीज़ा। B-2 आगंतुक वीज़ा इसी तरह का है।",
      es: "Una visa para una estadía corta y temporal. La visa de visitante B-2 es una de ellas.",
    },
    category: "visas",
  },
  immigrant: {
    term: { en: "Immigrant visa", hi: "आप्रवासी वीज़ा", es: "Visa de inmigrante" },
    definition: {
      en: "A visa for people who want to live in the U.S. for good. A visitor visa is not this.",
      hi: "उन लोगों के लिए वीज़ा जो हमेशा के लिए U.S. में रहना चाहते हैं। आगंतुक वीज़ा ऐसा नहीं है।",
      es: "Una visa para quienes quieren vivir en EE. UU. de forma permanente. La visa de visitante no es de este tipo.",
    },
    category: "visas",
  },

  // Forms & Documents
  ds160: {
    term: { en: "DS-160", hi: "DS-160", es: "DS-160" },
    definition: {
      en: "The online application form for a U.S. visitor visa.",
      hi: "U.S. आगंतुक वीज़ा के लिए ऑनलाइन आवेदन फ़ॉर्म।",
      es: "El formulario de solicitud en línea para una visa de visitante a EE. UU.",
    },
    category: "forms",
  },
  confirmation: {
    term: { en: "DS-160 confirmation page", hi: "DS-160 पुष्टि पृष्ठ", es: "Página de confirmación del DS-160" },
    definition: {
      en: "The page with a barcode you get when you finish the DS-160. Print it and take it to your interview.",
      hi: "DS-160 पूरा करने पर मिलने वाला बारकोड वाला पृष्ठ। इसे प्रिंट करें और इंटरव्यू में ले जाएँ।",
      es: "La página con un código de barras que recibe al terminar el DS-160. Imprímala y llévela a su entrevista.",
    },
    category: "forms",
  },
  i94: {
    term: { en: "I-94", hi: "I-94", es: "I-94" },
    definition: {
      en: "Your arrival and departure record. It shows the date you must leave the U.S.",
      hi: "आपका आगमन और प्रस्थान रिकॉर्ड। इसमें वह तारीख होती है जब तक आपको U.S. छोड़ना है।",
      es: "Su registro de llegada y salida. Muestra la fecha en que debe salir de EE. UU.",
    },
    category: "forms",
  },
  i539: {
    term: { en: "Form I-539", hi: "फ़ॉर्म I-539", es: "Formulario I-539" },
    definition: {
      en: "A form you can send to USCIS to ask to stay in the U.S. longer.",
      hi: "एक फ़ॉर्म जो U.S. में ज़्यादा रुकने की अनुमति माँगने के लिए USCIS को भेजा जा सकता है।",
      es: "Un formulario que puede enviar a USCIS para pedir quedarse más tiempo en EE. UU.",
    },
    category: "forms",
  },
  passport: {
    term: { en: "Passport", hi: "पासपोर्ट", es: "Pasaporte" },
    definition: {
      en: "Your travel document. It must still be valid 6 months after your stay in the U.S. ends.",
      hi: "आपका यात्रा दस्तावेज़। U.S. में ठहराव खत्म होने के 6 महीने बाद तक यह मान्य होना चाहिए।",
      es: "Su documento de viaje. Debe seguir vigente 6 meses después de que termine su estadía en EE. UU.",
    },
    category: "forms",
  },
  photo: {
    term: { en: "Visa photo", hi: "वीज़ा फ़ोटो", es: "Foto para la visa" },
    definition: {
      en: "A color photo of your face, taken in the last 6 months, on a plain white background. You upload it with the DS-160.",
      hi: "आपके चेहरे की रंगीन फ़ोटो, पिछले 6 महीनों में ली गई, सादे सफ़ेद पृष्ठभूमि पर। इसे DS-160 के साथ अपलोड करते हैं।",
      es: "Una foto a color de su rostro, tomada en los últimos 6 meses, con fondo blanco liso. Se sube junto con el DS-160.",
    },
    category: "forms",
  },

  // Agencies & Offices
  cbp: {
    term: { en: "CBP", hi: "CBP", es: "CBP" },
    definition: {
      en: "U.S. Customs and Border Protection. The officers who check you when you arrive at a U.S. airport.",
      hi: "U.S. कस्टम्स और बॉर्डर प्रोटेक्शन। U.S. हवाई अड्डे पर पहुँचने पर आपकी जाँच करने वाले अधिकारी।",
      es: "Protección de Aduanas y Fronteras de EE. UU. Los oficiales que lo revisan cuando llega a un aeropuerto de EE. UU.",
    },
    category: "agencies",
  },
  uscis: {
    term: { en: "USCIS", hi: "USCIS", es: "USCIS" },
    definition: {
      en: "U.S. Citizenship and Immigration Services. The office you ask if you want to stay longer than planned.",
      hi: "U.S. नागरिकता और आप्रवासन सेवा। अगर आप योजना से ज़्यादा रुकना चाहें, तो इसी कार्यालय से पूछना होता है।",
      es: "Servicios de Ciudadanía e Inmigración de EE. UU. La oficina a la que se pide si quiere quedarse más tiempo del planeado.",
    },
    category: "agencies",
  },
  vac: {
    term: { en: "VAC", hi: "VAC", es: "VAC" },
    definition: {
      en: "Visa Application Center. A place where your fingerprints and photo are taken.",
      hi: "वीज़ा आवेदन केंद्र। यहाँ आपकी उंगलियों के निशान और फ़ोटो लिए जाते हैं।",
      es: "Centro de Solicitud de Visas. Un lugar donde le toman las huellas digitales y la foto.",
    },
    category: "agencies",
  },
  embassy: {
    term: { en: "U.S. Embassy", hi: "U.S. Embassy", es: "Embajada de EE. UU." },
    definition: {
      en: "The main U.S. government office in another country. You can apply for your visa there.",
      hi: "किसी दूसरे देश में U.S. सरकार का मुख्य कार्यालय। आप वहाँ वीज़ा के लिए आवेदन कर सकते हैं।",
      es: "La oficina principal del gobierno de EE. UU. en otro país. Allí puede solicitar su visa.",
    },
    category: "agencies",
  },
  consulate: {
    term: { en: "U.S. Consulate", hi: "U.S. Consulate", es: "Consulado de EE. UU." },
    definition: {
      en: "A U.S. government office in a big city, like Mumbai or Chennai. You can apply for your visa there too.",
      hi: "किसी बड़े शहर में U.S. सरकार का कार्यालय, जैसे Mumbai या Chennai। आप वहाँ भी वीज़ा के लिए आवेदन कर सकते हैं।",
      es: "Una oficina del gobierno de EE. UU. en una ciudad grande, como Bombay o Chennai. También allí puede solicitar su visa.",
    },
    category: "agencies",
  },
  dos: {
    term: { en: "Department of State", hi: "U.S. विदेश विभाग", es: "Departamento de Estado" },
    definition: {
      en: "The part of the U.S. government that handles visas and collects the visa fee.",
      hi: "U.S. सरकार का वह विभाग जो वीज़ा का काम देखता है और वीज़ा शुल्क लेता है।",
      es: "La parte del gobierno de EE. UU. que se ocupa de las visas y cobra la tarifa de la visa.",
    },
    category: "agencies",
  },
  dhs: {
    term: { en: "DHS", hi: "DHS", es: "DHS" },
    definition: {
      en: "Department of Homeland Security. The part of the U.S. government that CBP and USCIS belong to.",
      hi: "होमलैंड सिक्योरिटी विभाग। U.S. सरकार का वह विभाग जिसके अंदर CBP और USCIS आते हैं।",
      es: "Departamento de Seguridad Nacional. La parte del gobierno de EE. UU. a la que pertenecen CBP y USCIS.",
    },
    category: "agencies",
  },

  // Process & Travel Terms
  interview: {
    term: { en: "Visa interview", hi: "वीज़ा इंटरव्यू", es: "Entrevista de la visa" },
    definition: {
      en: "A short meeting at the embassy or consulate. An officer asks about your trip and decides if you get the visa.",
      hi: "दूतावास या वाणिज्य दूतावास में एक छोटी मुलाक़ात। अधिकारी आपकी यात्रा के बारे में पूछते हैं और तय करते हैं कि वीज़ा मिलेगा या नहीं।",
      es: "Una reunión corta en la embajada o el consulado. Un oficial le pregunta sobre su viaje y decide si le da la visa.",
    },
    category: "process",
  },
  portofentry: {
    term: { en: "Port of entry", hi: "प्रवेश स्थल", es: "Punto de entrada" },
    definition: {
      en: "The place where you first enter the U.S., usually an airport. CBP officers check you there.",
      hi: "वह जगह जहाँ से आप पहली बार U.S. में प्रवेश करते हैं, आमतौर पर हवाई अड्डा। वहाँ CBP अधिकारी आपकी जाँच करते हैं।",
      es: "El lugar por donde entra por primera vez a EE. UU., normalmente un aeropuerto. Allí lo revisan los oficiales de CBP.",
    },
    category: "process",
  },
  admission: {
    term: { en: "Admission", hi: "प्रवेश की अनुमति", es: "Admisión" },
    definition: {
      en: "Permission to enter the U.S. The CBP officer decides this at the airport. A visa does not guarantee it.",
      hi: "U.S. में प्रवेश करने की अनुमति। यह CBP अधिकारी हवाई अड्डे पर तय करते हैं। वीज़ा से इसकी गारंटी नहीं मिलती।",
      es: "El permiso para entrar a EE. UU. Lo decide el oficial de CBP en el aeropuerto. La visa no lo garantiza.",
    },
    category: "process",
  },
  overstay: {
    term: { en: "Overstay", hi: "तय समय से ज़्यादा रुकना", es: "Quedarse más tiempo del permitido" },
    definition: {
      en: "Staying in the U.S. after the date on your I-94. Your visa is cancelled, and it can be hard to get a visa again.",
      hi: "I-94 की तारीख के बाद भी U.S. में रुकना। इससे आपका वीज़ा रद्द हो जाता है, और आगे वीज़ा मिलने में मुश्किल हो सकती है।",
      es: "Quedarse en EE. UU. después de la fecha de su I-94. Su visa se cancela y puede ser difícil volver a obtener una visa.",
    },
    category: "process",
  },
};
