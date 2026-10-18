import { LINKS } from "@/lib/config";
import type { DocId } from "./documents";
import type { StepId } from "@/lib/journey";
import type { Lang } from "@/lib/settings";

// Step content for the India -> U.S. B-2 visitor visa journey.
//
// Sources for the facts: the U.S. State Department visitor visa page
// (travel.state.gov) unless marked otherwise. Anything marked VERIFY came from
// non-official guides and must be checked against the official page.
//
// Write for an elderly reader in India: need-to-know only, one short sentence
// per bullet. Write the English first, then Hindi. Hindi is a first draft:
// have a fluent reader check it. Use [[term|Shown text]] to make a glossary
// chip (terms are defined in content/glossary.ts).

export interface StepText {
  title: string;
  /** What to do, one short sentence per bullet. */
  what: string[];
  /** One short fact per bullet. Leave out when there is nothing useful to say; the section is then hidden. */
  cost?: string[];
  time?: string[];
  /** One-line summary, shown in the "Your next step" card. */
  simple: string;
}

export interface StepLink {
  label: Record<Lang, string>;
  url: string;
}

export interface StepContent {
  id: StepId;
  text: Record<Lang, StepText>;
  /** The "What you need" list: ids from content/documents.ts. */
  documents: DocId[];
  links: StepLink[];
  /** Optional in-app button shown at the top of the step's details. */
  action?: { label: Record<Lang, string>; href: string };
}

export const STEPS: StepContent[] = [
  {
    id: "ready",
    documents: ["passport", "travelDates"],
    text: {
      en: {
        title: "Get ready",
        what: [
          "Check your passport.",
          "It must still be valid 6 months after you come home.",
          "Know why you are going.",
          "Know how long you will stay.",
        ],
        time: ["About 1 week."],
        simple: "Make sure your passport will not expire soon. Know why you are going.",
      },
      hi: {
        title: "तैयारी करें",
        what: [
          "अपना पासपोर्ट देखें।",
          "लौटने के 6 महीने बाद तक वह मान्य होना चाहिए।",
          "जानें कि आप क्यों जा रहे हैं।",
          "जानें कि आप कितने समय रुकेंगे।",
        ],
        time: ["लगभग 1 सप्ताह।"],
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
    documents: ["passport", "travelFamilyDetails", "photo"],
    text: {
      en: {
        title: "Fill in the online form",
        what: [
          "Fill in the online form [[ds160|DS-160]].",
          "Answer every question honestly.",
          "Upload a photo that follows the rules.",
          "At the end, print the page with the barcode.",
          "Take this page to your interview.",
        ],
        cost: ["The form is free.", "You pay the visa fee in the next step."],
        time: ["A few hours.", "You can save the form and finish it later."],
        simple: "Answer every question honestly. Print the confirmation page at the end.",
      },
      hi: {
        title: "ऑनलाइन फ़ॉर्म भरें",
        what: [
          "ऑनलाइन फ़ॉर्म [[ds160|DS-160]] भरें।",
          "हर सवाल का सच्चा जवाब दें।",
          "नियमों के अनुसार फ़ोटो अपलोड करें।",
          "अंत में बारकोड वाला पृष्ठ प्रिंट करें।",
          "यह पृष्ठ इंटरव्यू में ले जाएँ।",
        ],
        cost: ["फ़ॉर्म मुफ़्त है।", "वीज़ा शुल्क आप अगले कदम में भरते हैं।"],
        time: ["कुछ घंटे।", "आप फ़ॉर्म सेव करके बाद में पूरा कर सकते हैं।"],
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
    documents: ["ds160Confirmation", "feeReceipt", "passport"],
    text: {
      en: {
        title: "Pay the fee and book your appointments",
        what: [
          "Pay the visa fee.",
          "Then book your interview at a U.S. office in India.",
          "You may also need to visit a [[vac|VAC]] first, for fingerprints.",
          "Book as early as you can. The wait is long.",
          "Follow the U.S. Embassy website. The steps can change.",
        ],
        cost: ["Visa fee: $185.", "Other fees may apply."],
        time: ["Booking: about 1 day.", "Waiting for the interview: usually months."],
        simple: "Pay, then book. Book as early as you can.",
      },
      hi: {
        title: "शुल्क भरें और अपॉइंटमेंट बुक करें",
        what: [
          "वीज़ा शुल्क भरें।",
          "फिर भारत में किसी अमेरिकी कार्यालय में इंटरव्यू बुक करें।",
          "शायद पहले उंगलियों के निशान के लिए [[vac|VAC]] भी जाना पड़े।",
          "जितना जल्दी हो सके बुक करें। प्रतीक्षा लंबी होती है।",
          "अमेरिकी दूतावास की वेबसाइट देखें। तरीके बदल सकते हैं।",
        ],
        cost: ["वीज़ा शुल्क: $185।", "दूसरे शुल्क भी लग सकते हैं।"],
        time: ["बुकिंग: लगभग 1 दिन।", "इंटरव्यू की प्रतीक्षा: आमतौर पर कई महीने।"],
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
    documents: ["passport", "ds160Confirmation", "feeReceipt", "appointmentLetters", "lifeInIndia", "fundsProof", "tripPlan"],
    text: {
      en: {
        title: "Gather your documents",
        what: [
          "Collect the papers the officer may ask for.",
          "Show that your life is in India: family, home or pension.",
          "Show that you will come home.",
          "Show how the trip will be paid for.",
          "A letter from family in the U.S. is not needed.",
        ],
        time: ["1 to 2 weeks."],
        simple: "Gather papers that show your life is in India and that you will go home after the trip.",
      },
      hi: {
        title: "अपने कागज़ात इकट्ठा करें",
        what: [
          "अधिकारी जो कागज़ माँग सकते हैं, वे इकट्ठा करें।",
          "दिखाएँ कि आपका जीवन भारत में है: परिवार, घर या पेंशन।",
          "दिखाएँ कि आप वापस लौटेंगे।",
          "दिखाएँ कि यात्रा का खर्च कैसे उठाया जाएगा।",
          "अमेरिका में परिवार का पत्र ज़रूरी नहीं है।",
        ],
        time: ["1 से 2 सप्ताह।"],
        simple: "ऐसे कागज़ात जुटाइए जो दिखाएँ कि आपका जीवन भारत में है और आप यात्रा के बाद लौटेंगे।",
      },
    },
    links: [
      { label: { en: "What the officer may ask for (official)", hi: "अधिकारी क्या माँग सकते हैं (आधिकारिक)" }, url: LINKS.visitorVisa },
    ],
  },
  {
    id: "practice",
    documents: ["tripPlan", "lastStepPapers"],
    text: {
      en: {
        title: "Practice for the interview",
        what: [
          "Practice your answers out loud.",
          "Who will you visit?",
          "How long will you stay?",
          "Why will you come home?",
          "Answer honestly, in your own words. Keep it short.",
        ],
        time: ["A few evenings."],
        simple: "Practice saying your answers out loud.",
      },
      hi: {
        title: "इंटरव्यू की तैयारी करें",
        what: [
          "अपने जवाब ज़ोर से बोलकर अभ्यास करें।",
          "आप किससे मिलेंगे?",
          "आप कितने समय रुकेंगे?",
          "आप घर क्यों लौटेंगे?",
          "सच्चाई से, अपने शब्दों में, छोटा जवाब दें।",
        ],
        time: ["कुछ शामें।"],
        simple: "अपने जवाब ज़ोर से बोलकर अभ्यास करें।",
      },
    },
    links: [
      { label: { en: "U.S. Embassy in India: visas", hi: "भारत में अमेरिकी दूतावास: वीज़ा" }, url: LINKS.embassyIndia },
    ],
  },
  {
    id: "travel",
    documents: ["passportWithVisa", "flightDetails", "insurance"],
    text: {
      en: {
        title: "Book your flight",
        what: [
          "Wait until you have your visa and your passport is back.",
          "Then compare flights with the button above.",
          "Pick a flight with few stops and enough time to change planes.",
          "Ask the airline for wheelchair help if you need it.",
          "Think about travel insurance.",
        ],
        simple: "Buy tickets only after you have your visa. We help you compare flights.",
      },
      hi: {
        title: "अपनी उड़ान बुक करें",
        what: [
          "वीज़ा मिलने और पासपोर्ट वापस आने तक रुकें।",
          "फिर ऊपर दिए बटन से उड़ानों की तुलना करें।",
          "कम पड़ाव और विमान बदलने के लिए पर्याप्त समय वाली उड़ान चुनें।",
          "ज़रूरत हो तो एयरलाइन से व्हीलचेयर सहायता माँगें।",
          "यात्रा बीमा के बारे में सोचें।",
        ],
        simple: "वीज़ा मिलने के बाद ही टिकट खरीदें। हम उड़ानों की तुलना में मदद करते हैं।",
      },
    },
    action: {
      label: { en: "Find and compare flights", hi: "उड़ानें खोजें और तुलना करें" },
      href: "/flights",
    },
    links: [{ label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ" }, url: LINKS.visitorVisa }],
  },
  {
    id: "arrive",
    documents: ["passportWithVisa", "stayAddress", "tripDetails"],
    text: {
      en: {
        title: "Arrive in the U.S.",
        what: [
          "Keep your passport, visa and trip details ready.",
          "A U.S. border officer ([[cbp|CBP]]) checks you at the airport.",
          "The officer decides if you can enter, and for how long.",
          "A visa does not guarantee entry.",
          "Your leave date is on your [[i94|I-94]] record.",
        ],
        simple: "Keep your papers ready. The officer decides how long you can stay.",
      },
      hi: {
        title: "अमेरिका पहुँचें",
        what: [
          "पासपोर्ट, वीज़ा और यात्रा की जानकारी तैयार रखें।",
          "हवाई अड्डे पर अमेरिकी सीमा अधिकारी ([[cbp|CBP]]) आपकी जाँच करते हैं।",
          "अधिकारी तय करते हैं कि आप प्रवेश कर सकते हैं या नहीं, और कितने समय के लिए।",
          "वीज़ा से प्रवेश की गारंटी नहीं मिलती।",
          "लौटने की तारीख आपके [[i94|I-94]] रिकॉर्ड में होती है।",
        ],
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
    documents: ["i94", "returnTicket"],
    text: {
      en: {
        title: "Return on time",
        what: [
          "Leave the U.S. by the date on your [[i94|I-94]] record.",
          "Do not work during your visit.",
          "Staying too long can cancel your visa.",
          "Want to stay longer? Read the rules before that date.",
        ],
        cost: ["Asking to stay longer may cost a fee.", "Ask [[uscis|USCIS]] about the fee."],
        simple: "Go home on time. Do not work.",
      },
      hi: {
        title: "समय पर लौटें",
        what: [
          "[[i94|I-94]] रिकॉर्ड की तारीख तक अमेरिका छोड़ दें।",
          "यात्रा के दौरान काम न करें।",
          "ज़्यादा रुकने से वीज़ा रद्द हो सकता है।",
          "ज़्यादा रुकना है? उस तारीख से पहले नियम पढ़ें।",
        ],
        cost: ["ज़्यादा रुकने के आवेदन पर शुल्क लग सकता है।", "शुल्क के बारे में [[uscis|USCIS]] से पूछें।"],
        simple: "समय पर घर लौटें। काम न करें।",
      },
    },
    links: [
      { label: { en: "USCIS: extend your stay", hi: "USCIS: ठहराव बढ़ाना" }, url: LINKS.uscisExtend },
      { label: { en: "Look up your I-94", hi: "अपना I-94 देखें" }, url: LINKS.i94 },
    ],
  }, {
    id: "i20",
    documents: ["i20Form"], 
    links: [],
    text: {
      en: {
        title: "Receive your Form I-20",
        what: [
          "Once accepted, your U.S. university's international office will issue a Form I-20.",
          "Check that your name and birthdate exactly match your passport.",
          "You must have this document before you can pay your SEVIS fee or apply for a visa.",
        ],
        simple: "Wait for your U.S. university to send your official I-20 document.",
      },
      hi: {
        title: "अपना फॉर्म I-20 प्राप्त करें",
        what: [
          "स्वीकार किए जाने के बाद, आपका अमेरिकी विश्वविद्यालय एक फॉर्म I-20 जारी करेगा।",
          "जांचें कि आपका नाम और जन्म तिथि आपके पासपोर्ट से बिल्कुल मेल खाते हैं।",
          "वीज़ा के लिए आवेदन करने या SEVIS शुल्क का भुगतान करने से पहले आपके पास यह दस्तावेज़ होना चाहिए।",
        ],
        simple: "अपने अमेरिकी विश्वविद्यालय से आधिकारिक I-20 दस्तावेज़ आने की प्रतीक्षा करें।",
      },
    },
  },
  {
    id: "sevis",
    documents: ["sevisReceipt"],
    links: [
      { 
        url: "https://www.fmjfee.com/i901fee/index.html", 
        label: { en: "Pay SEVIS Fee (Official)", hi: "SEVIS शुल्क भरें (आधिकारिक)" } 
      }
    ],
    text: {
      en: {
        title: "Pay the SEVIS I-901 Fee",
        cost: ["$350 for F-1 students"],
        what: [
          "You must pay the SEVIS fee before applying for your visa.",
          "Go to the official FMJfee website to submit your payment.",
          "Keep the payment receipt and print it out, as you must bring it to your interview.",
        ],
        simple: "Pay your mandatory student tracking fee to the U.S. government.",
      },
      hi: {
        title: "SEVIS I-901 शुल्क भरें",
        cost: ["F-1 छात्रों के लिए $350"],
        what: [
          "वीज़ा के लिए आवेदन करने से पहले आपको SEVIS शुल्क का भुगतान करना होगा।",
          "भुगतान करने के लिए आधिकारिक FMJfee वेबसाइट पर जाएं।",
          "भुगतान की रसीद संभाल कर रखें और उसका प्रिंट निकाल लें, इसे इंटरव्यू में ले जाना ज़रूरी है।",
        ],
        simple: "अमेरिकी सरकार को अपना अनिवार्य छात्र ट्रैकिंग शुल्क भरें।",
      },
    },
  },
  {
    id: "petition",
    documents: ["i797Notice"],
    links: [],
    text: {
      en: {
        title: "Wait for I-797 Approval",
        what: [
          "Your U.S. employer must file an I-129 petition with USCIS on your behalf.",
          "You cannot apply for your visa or schedule an interview until you receive the approved Form I-797 Notice of Action.",
          "Coordinate with your employer's immigration lawyer for updates.",
        ],
        simple: "Wait for your employer's petition to be approved by USCIS.",
      },
      hi: {
        title: "I-797 स्वीकृति की प्रतीक्षा करें",
        what: [
          "आपका अमेरिकी नियोक्ता आपकी ओर से USCIS में I-129 याचिका दायर करेगा।",
          "जब तक आपको स्वीकृत फॉर्म I-797 नोटिस नहीं मिल जाता, तब तक आप वीज़ा आवेदन या इंटरव्यू बुक नहीं कर सकते।",
          "अपडेट के लिए अपने नियोक्ता के इमिग्रेशन वकील से संपर्क में रहें।",
        ],
        simple: "USCIS द्वारा आपके नियोक्ता की याचिका स्वीकृत होने की प्रतीक्षा करें।",
      },
    },
  },
];

export const STEP_BY_ID: Record<StepId, StepContent> = Object.fromEntries(
  STEPS.map((s) => [s.id, s]),
) as Record<StepId, StepContent>;
