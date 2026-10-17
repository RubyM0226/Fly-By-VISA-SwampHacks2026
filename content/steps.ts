import { LINKS } from "@/lib/config";
import type { StepId } from "@/lib/journey";
import type { Lang } from "@/lib/settings";

// Step content for the India -> U.S. B-2 visitor visa journey.
//
// Sources for the facts: the U.S. State Department visitor visa page
// (travel.state.gov) unless marked otherwise. Anything marked VERIFY came from
// non-official guides and must be checked against the official page.
//
// Write the English first, then Hindi. Hindi is a first draft: have a fluent
// reader check it. Use [[term|Shown text]] to make a glossary chip
// (terms are defined in content/glossary.ts).

export interface StepText {
  title: string;
  what: string;
  why: string;
  documents: string[];
  cost: string;
  time: string;
  /** Plain-language version for "Explain simply". Later: generate with Gemini. */
  simple: string;
}

export interface StepLink {
  label: Record<Lang, string>;
  url: string;
}

export interface StepContent {
  id: StepId;
  text: Record<Lang, StepText>;
  links: StepLink[];
}

export const STEPS: StepContent[] = [
  {
    id: "ready",
    text: {
      en: {
        title: "Get ready",
        what: "Check that your passport is valid for at least six months after the day you plan to come home. Be clear about why you are going and how long you will stay.",
        why: "Everything else depends on a valid passport and a clear reason for your trip.",
        documents: ["Your passport", "Your planned travel dates"],
        cost: "No fee at this step.",
        time: "About a week",
        simple: "Make sure your passport will not expire soon. Know why you are going.",
      },
      hi: {
        title: "तैयारी करें",
        what: "देखिए कि आपका पासपोर्ट लौटने की तारीख के बाद कम से कम छह महीने तक मान्य हो। यात्रा का कारण और ठहरने का समय साफ़ रखें।",
        why: "बाकी सब कुछ वैध पासपोर्ट और यात्रा के स्पष्ट कारण पर निर्भर है।",
        documents: ["आपका पासपोर्ट", "यात्रा की संभावित तारीखें"],
        cost: "इस कदम में कोई शुल्क नहीं।",
        time: "लगभग एक सप्ताह",
        simple: "देखिए कि पासपोर्ट जल्दी खत्म न हो रहा हो। जानिए कि आप क्यों जा रहे हैं।",
      },
    },
    links: [
      {
        label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ" },
        url: LINKS.visitorVisa,
      },
      {
        label: { en: "Official Visa Wizard", hi: "आधिकारिक वीज़ा विज़ार्ड" },
        url: LINKS.visaWizard,
      },
    ],
  },
  {
    id: "ds160",
    text: {
      en: {
        title: "Fill in the online form",
        what: "Fill in the online form called [[ds160|DS-160]]. Upload a photo that follows the rules. At the end, print the confirmation page with the barcode.",
        why: "The officer uses this form to open your application. You must bring the confirmation page to your interview.",
        documents: ["Passport details", "Travel and family details", "A digital photo that follows the rules"],
        cost: "The form itself is free. The visa fee comes next.",
        time: "Plan for a few hours",
        simple: "Answer every question honestly. Print the confirmation page at the end.",
      },
      hi: {
        title: "ऑनलाइन फ़ॉर्म भरें",
        what: "ऑनलाइन फ़ॉर्म [[ds160|DS-160]] भरें। नियमों के अनुसार फ़ोटो अपलोड करें। अंत में बारकोड वाला पुष्टि पृष्ठ प्रिंट करें।",
        why: "अधिकारी इसी फ़ॉर्म से आपका आवेदन खोलते हैं। इंटरव्यू में पुष्टि पृष्ठ ले जाना ज़रूरी है।",
        documents: ["पासपोर्ट की जानकारी", "यात्रा और परिवार की जानकारी", "नियमों के अनुसार डिजिटल फ़ोटो"],
        cost: "फ़ॉर्म मुफ़्त है। वीज़ा शुल्क अगला कदम है।",
        time: "कुछ घंटे का समय रखें",
        simple: "हर सवाल का जवाब सच्चाई से दें। अंत में पुष्टि पृष्ठ प्रिंट करें।",
      },
    },
    links: [
      { label: { en: "Open the official DS-160 form", hi: "आधिकारिक DS-160 फ़ॉर्म खोलें" }, url: LINKS.ds160 },
      { label: { en: "Official photo rules", hi: "फ़ोटो के आधिकारिक नियम" }, url: LINKS.photoRules },
    ],
  },
  {
    id: "book",
    text: {
      en: {
        title: "Pay the fee and book your appointments",
        what: "Pay the visa application fee, then book your interview at a U.S. office in India. In India, many applicants also book a visit to a [[vac|VAC]] for fingerprints first. Follow the steps on the U.S. Embassy in India website, because booking steps can change.",
        why: "The wait for an interview is the longest part of the journey, so booking early matters most.",
        documents: ["[[ds160|DS-160]] confirmation page", "Payment receipt", "Your passport"],
        cost: "$185 application fee. Other fees may apply, so check the official fee page.",
        time: "Booking takes about a day. The wait for the interview is usually months.",
        simple: "Pay, then book. Book as early as you can.",
      },
      hi: {
        title: "शुल्क भरें और अपॉइंटमेंट बुक करें",
        what: "वीज़ा आवेदन शुल्क भरें, फिर भारत में किसी अमेरिकी कार्यालय में अपना इंटरव्यू बुक करें। भारत में कई आवेदक पहले उंगलियों के निशान के लिए [[vac|VAC]] की अपॉइंटमेंट भी बुक करते हैं। भारत में अमेरिकी दूतावास की वेबसाइट के निर्देश देखें, क्योंकि बुकिंग के तरीके बदल सकते हैं।",
        why: "इंटरव्यू की प्रतीक्षा यात्रा का सबसे लंबा हिस्सा है, इसलिए जल्दी बुक करना सबसे ज़रूरी है।",
        documents: ["[[ds160|DS-160]] पुष्टि पृष्ठ", "भुगतान की रसीद", "आपका पासपोर्ट"],
        cost: "$185 आवेदन शुल्क। दूसरे शुल्क भी लग सकते हैं, इसलिए आधिकारिक शुल्क पृष्ठ देखें।",
        time: "बुकिंग में लगभग एक दिन लगता है। इंटरव्यू की प्रतीक्षा आमतौर पर महीनों की होती है।",
        simple: "पहले भुगतान करें, फिर बुक करें। जितना जल्दी हो सके बुक करें।",
      },
    },
    // VERIFY: the two-appointment (VAC + interview) flow and the booking portal
    // for India come from non-official guides that disagree. Confirm on the
    // embassy page before the demo.
    links: [
      { label: { en: "Official fee page", hi: "आधिकारिक शुल्क पृष्ठ" }, url: LINKS.fees },
      { label: { en: "U.S. Embassy in India: visas", hi: "भारत में अमेरिकी दूतावास: वीज़ा" }, url: LINKS.embassyIndia },
      { label: { en: "Official wait times", hi: "आधिकारिक प्रतीक्षा समय" }, url: LINKS.waitTimes },
    ],
  },
  {
    id: "documents",
    text: {
      en: {
        title: "Gather your documents",
        what: "Collect the papers the officer may ask for. Show that your life is in India and that you will come home: for example family, a home or a pension. Also show why you are going and how the trip will be paid for.",
        why: "The officer decides by looking at your own life and plans. A letter of invitation from family in the U.S. is not required and does not decide the outcome.",
        documents: [
          "Your passport",
          "[[ds160|DS-160]] confirmation page",
          "Fee payment receipt",
          "Your appointment letters",
          "Proof of your life in India (family, home, pension or work)",
          "Proof of how the trip will be paid for",
          "A simple plan for your trip",
        ],
        cost: "No fee at this step.",
        time: "Plan for one to two weeks to collect everything",
        simple: "Gather papers that show your life is in India and that you will go home after the trip.",
      },
      hi: {
        title: "अपने कागज़ात इकट्ठा करें",
        what: "वे कागज़ात इकट्ठा करें जो अधिकारी माँग सकते हैं। दिखाइए कि आपका जीवन भारत में है और आप लौटेंगे, जैसे परिवार, घर या पेंशन। यह भी दिखाइए कि आप क्यों जा रहे हैं और खर्च कैसे उठाया जाएगा।",
        why: "अधिकारी आपके अपने जीवन और योजनाओं को देखकर फ़ैसला करते हैं। अमेरिका में परिवार का निमंत्रण पत्र ज़रूरी नहीं है और उससे फ़ैसला तय नहीं होता।",
        documents: [
          "आपका पासपोर्ट",
          "[[ds160|DS-160]] पुष्टि पृष्ठ",
          "शुल्क भुगतान की रसीद",
          "आपके अपॉइंटमेंट पत्र",
          "भारत में आपके जीवन का प्रमाण (परिवार, घर, पेंशन या काम)",
          "यात्रा का खर्च कैसे उठाया जाएगा, इसका प्रमाण",
          "यात्रा की एक सरल योजना",
        ],
        cost: "इस कदम में कोई शुल्क नहीं।",
        time: "सब इकट्ठा करने में एक से दो सप्ताह का समय रखें",
        simple: "ऐसे कागज़ात जुटाइए जो दिखाएँ कि आपका जीवन भारत में है और आप यात्रा के बाद लौटेंगे।",
      },
    },
    links: [
      { label: { en: "What the officer may ask for (official)", hi: "अधिकारी क्या माँग सकते हैं (आधिकारिक)" }, url: LINKS.visitorVisa },
    ],
  },
  {
    id: "practice",
    text: {
      en: {
        title: "Practice for the interview",
        what: "Practice answering questions about your trip: who you will visit, how long you will stay, and why you will come home. Answer in your own words, honestly and briefly.",
        why: "Most people feel nervous. Practice helps you stay calm and clear.",
        documents: ["Your trip plan", "The papers from the last step"],
        cost: "Free",
        time: "A few evenings",
        simple: "Practice saying your answers out loud.",
      },
      hi: {
        title: "इंटरव्यू की तैयारी करें",
        what: "अपनी यात्रा के बारे में सवालों के जवाब देने का अभ्यास करें: आप किससे मिलेंगे, कितने समय रुकेंगे, और घर क्यों लौटेंगे। अपने शब्दों में, सच्चाई से और संक्षेप में जवाब दें।",
        why: "ज़्यादातर लोग घबराते हैं। अभ्यास से आप शांत और स्पष्ट रह पाते हैं।",
        documents: ["आपकी यात्रा की योजना", "पिछले कदम के कागज़ात"],
        cost: "मुफ़्त",
        time: "कुछ शामें",
        simple: "अपने जवाब ज़ोर से बोलकर अभ्यास करें।",
      },
    },
    links: [
      { label: { en: "U.S. Embassy in India: visas", hi: "भारत में अमेरिकी दूतावास: वीज़ा" }, url: LINKS.embassyIndia },
    ],
  },
  {
    id: "travel",
    text: {
      en: {
        title: "Book your travel",
        what: "After your visa is approved and your passport is back with you, book your flights. Consider travel insurance too.",
        why: "A visa is never guaranteed, so do not buy tickets before you have it.",
        documents: ["Passport with the visa", "Flight details", "Travel insurance papers, if you buy it"],
        cost: "Flight and insurance prices vary.",
        time: "A few days",
        simple: "Buy tickets only after you have your visa.",
      },
      hi: {
        title: "यात्रा बुक करें",
        what: "वीज़ा मंज़ूर होने और पासपोर्ट वापस मिलने के बाद अपनी उड़ानें बुक करें। यात्रा बीमा के बारे में भी सोचिए।",
        why: "वीज़ा की कभी गारंटी नहीं होती, इसलिए वीज़ा मिलने से पहले टिकट न खरीदें।",
        documents: ["वीज़ा वाला पासपोर्ट", "उड़ान की जानकारी", "यात्रा बीमा के कागज़, अगर लें"],
        cost: "उड़ान और बीमा की कीमतें अलग-अलग होती हैं।",
        time: "कुछ दिन",
        simple: "वीज़ा मिलने के बाद ही टिकट खरीदें।",
      },
    },
    links: [{ label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ" }, url: LINKS.visitorVisa }],
  },
  {
    id: "arrive",
    text: {
      en: {
        title: "Arrive in the U.S.",
        what: "At the airport, a U.S. border officer ([[cbp|CBP]]) decides whether to let you in and for how long. Keep your passport, visa and trip details ready.",
        why: "A visa lets you ask to enter. It does not guarantee entry. The officer records your allowed stay on your arrival record ([[i94|I-94]]).",
        documents: ["Passport with the visa", "The address where you will stay", "Your trip details"],
        cost: "No visa fee at this step.",
        time: "Arrival day",
        simple: "Keep your papers ready. The officer decides how long you can stay.",
      },
      hi: {
        title: "अमेरिका पहुँचें",
        what: "हवाई अड्डे पर अमेरिकी सीमा अधिकारी ([[cbp|CBP]]) तय करते हैं कि आपको प्रवेश दिया जाए या नहीं, और कितने समय के लिए। पासपोर्ट, वीज़ा और यात्रा की जानकारी तैयार रखें।",
        why: "वीज़ा से आप प्रवेश माँग सकते हैं। यह प्रवेश की गारंटी नहीं है। अधिकारी आपके ठहरने की अनुमत अवधि आगमन रिकॉर्ड ([[i94|I-94]]) में दर्ज करते हैं।",
        documents: ["वीज़ा वाला पासपोर्ट", "जहाँ आप ठहरेंगे उसका पता", "आपकी यात्रा की जानकारी"],
        cost: "इस कदम में कोई वीज़ा शुल्क नहीं।",
        time: "पहुँचने का दिन",
        simple: "कागज़ात तैयार रखें। अधिकारी तय करते हैं कि आप कितने दिन रुक सकते हैं।",
      },
    },
    links: [
      { label: { en: "CBP: information for visitors", hi: "CBP: आगंतुकों के लिए जानकारी" }, url: LINKS.cbpVisitors },
      { label: { en: "Look up your I-94", hi: "अपना I-94 देखें" }, url: LINKS.i94 },
    ],
  },
  {
    id: "return",
    text: {
      en: {
        title: "Return on time",
        what: "Leave the U.S. by the date on your arrival record ([[i94|I-94]]). Do not work during your visit. If your plans change, read the rules about extending your stay before the date passes.",
        why: "Staying too long can cancel your visa and make future visas harder to get.",
        documents: ["Your arrival record ([[i94|I-94]])", "Your return ticket"],
        cost: "Asking to extend your stay may have a fee. Ask [[uscis|USCIS]].",
        time: "Plan this before you leave home",
        simple: "Go home on time. Do not work.",
      },
      hi: {
        title: "समय पर लौटें",
        what: "अपने आगमन रिकॉर्ड ([[i94|I-94]]) में दी गई तारीख तक अमेरिका छोड़ दें। यात्रा के दौरान काम न करें। अगर योजना बदले, तो तारीख निकलने से पहले ठहराव बढ़ाने के नियम पढ़ लें।",
        why: "ज़्यादा रुकने से आपका वीज़ा रद्द हो सकता है और आगे वीज़ा मिलना मुश्किल हो सकता है।",
        documents: ["आपका आगमन रिकॉर्ड ([[i94|I-94]])", "वापसी का टिकट"],
        cost: "ठहराव बढ़ाने के आवेदन पर शुल्क लग सकता है। [[uscis|USCIS]] से पूछें।",
        time: "घर से निकलने से पहले इसकी योजना बनाएँ",
        simple: "समय पर घर लौटें। काम न करें।",
      },
    },
    links: [
      { label: { en: "USCIS: extend your stay", hi: "USCIS: ठहराव बढ़ाना" }, url: LINKS.uscisExtend },
      { label: { en: "Look up your I-94", hi: "अपना I-94 देखें" }, url: LINKS.i94 },
    ],
  },
];

export const STEP_BY_ID: Record<StepId, StepContent> = Object.fromEntries(
  STEPS.map((s) => [s.id, s]),
) as Record<StepId, StepContent>;
