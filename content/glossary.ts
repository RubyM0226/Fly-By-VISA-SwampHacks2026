import type { Lang } from "@/lib/settings";

// Words people will not know. Used by [[key|Shown text]] markup in the step text.
export const GLOSSARY: Record<string, Record<Lang, string>> = {
  ds160: {
    en: "The online application form for a U.S. visitor visa.",
    hi: "अमेरिकी आगंतुक वीज़ा के लिए ऑनलाइन आवेदन फ़ॉर्म।",
  },
  vac: {
    en: "Visa Application Center. A place where your fingerprints and photo are taken.",
    hi: "वीज़ा आवेदन केंद्र। यहाँ आपकी उंगलियों के निशान और फ़ोटो लिए जाते हैं।",
  },
  i94: {
    en: "Your arrival and departure record. It shows the date you must leave the U.S.",
    hi: "आपका आगमन और प्रस्थान रिकॉर्ड। इसमें वह तारीख होती है जब तक आपको अमेरिका छोड़ना है।",
  },
  cbp: {
    en: "U.S. Customs and Border Protection. The officers who check you when you arrive at a U.S. airport.",
    hi: "अमेरिकी कस्टम्स और बॉर्डर प्रोटेक्शन। अमेरिकी हवाई अड्डे पर पहुँचने पर आपकी जाँच करने वाले अधिकारी।",
  },
  uscis: {
    en: "U.S. Citizenship and Immigration Services. The office you ask if you want to stay longer than planned.",
    hi: "अमेरिकी नागरिकता और आप्रवासन सेवा। अगर आप योजना से ज़्यादा रुकना चाहें, तो इसी कार्यालय से पूछना होता है।",
  },
  b2: {
    en: "The visitor visa for tourism and visiting family.",
    hi: "पर्यटन और परिवार से मिलने के लिए आगंतुक वीज़ा।",
  },
};
